/*
 * Copyright (C) 2025 Kevin Buzeau
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
package com.buzbuz.smartautoclicker.core.common.actions

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.content.ActivityNotFoundException
import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.media.MediaScannerConnection
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import android.util.AndroidRuntimeException
import android.util.Log
import java.io.File
import java.io.FileOutputStream
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

import com.buzbuz.smartautoclicker.core.common.actions.gesture.GestureExecutor
import com.buzbuz.smartautoclicker.core.common.actions.model.ActionNotificationRequest
import com.buzbuz.smartautoclicker.core.common.actions.notification.NotificationRequestExecutor
import com.buzbuz.smartautoclicker.core.common.actions.text.TextExecutor
import com.buzbuz.smartautoclicker.core.display.recorder.DisplayRecorder

import kotlinx.coroutines.delay
import java.io.PrintWriter
import java.lang.ref.WeakReference
import javax.inject.Inject
import javax.inject.Singleton


@Singleton
internal class AndroidActionExecutorImpl @Inject constructor(
    private val gestureExecutor: GestureExecutor,
    private val notificationRequestExecutor: NotificationRequestExecutor,
    private val textExecutor: TextExecutor,
    private val displayRecorder: DisplayRecorder,
) : AndroidActionExecutor {

    /** Keep the service in a week reference to avoid potential leak. */
    private var accessibilityServiceRef: WeakReference<AccessibilityService>? = null
    private val accessibilityService: AccessibilityService?
        get() {
            val ref = accessibilityServiceRef ?: let {
                Log.w(TAG, "Can't get accessibility service, init has not been called")
                return null
            }
            return ref.get() ?: let {
                Log.w(TAG, "Can't get accessibility service, it has been destroyed")
                null
            }
        }

    override fun init(service: AccessibilityService) {
        accessibilityServiceRef = WeakReference(service)
        notificationRequestExecutor.init(service)
    }

    override fun resetState() {
        gestureExecutor.clear()
        notificationRequestExecutor.clear()
    }

    override fun clear() {
        resetState()
        accessibilityServiceRef = null
    }

    override suspend fun dispatchGesture(gestureDescription: GestureDescription) {
        val service = accessibilityService ?: return

        if (!gestureExecutor.dispatchGesture(service, gestureDescription)) {
            Log.w(TAG, "System did not execute the gesture properly, delaying processing to avoid spamming slow system")
            delay(500)
        }
    }

    override fun performGlobalAction(globalAction: Int) {
        val service = accessibilityService ?: return

        try {
            service.performGlobalAction(globalAction)
        } catch (ex: Exception) {
            Log.w(TAG, "Can't execute global action.", ex)
        }
    }

    override fun writeTextOnFocusedItem(text: String, validate: Boolean) {
        val service = accessibilityService ?: return

        textExecutor.writeText(service, text, validate)
    }

    override fun startActivity(intent: Intent) {
        val service = accessibilityService ?: return

        try {
            service.startActivity(intent)
        } catch (anfe: ActivityNotFoundException) {
            Log.w(TAG, "Can't start activity, it is not found.", anfe)
        } catch (arex: AndroidRuntimeException) {
            Log.w(TAG, "Can't start activity, Intent is invalid: $intent", arex)
        } catch (iaex: IllegalArgumentException) {
            Log.w(TAG, "Can't start activity, Intent contains invalid arguments: $intent", iaex)
        } catch (secEx: SecurityException) {
            Log.w(TAG, "Can't start activity with intent $intent, permission is denied by the system", secEx)
        } catch (npe: NullPointerException) {
            Log.w(TAG, "Can't start activity with intent $intent, intent is invalid", npe)
        }
    }

    override fun sendBroadcast(intent: Intent) {
        val service = accessibilityService ?: return

        try {
            service.sendBroadcast(intent)
        } catch (iaex: IllegalArgumentException) {
            Log.w(TAG, "Can't send broadcast, Intent is invalid: $intent", iaex)
        }
    }

    override fun postNotification(notificationRequest: ActionNotificationRequest) {
        accessibilityService ?: return // No need for service here, but init state is bound to it
        notificationRequestExecutor.postNotification(notificationRequest)
    }

    override suspend fun takeScreenshot(path: String?) {
        val service = accessibilityService ?: return

        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R) {
            kotlin.coroutines.suspendCoroutine<Unit> { cont ->
                service.takeScreenshot(
                    android.view.Display.DEFAULT_DISPLAY,
                    service.mainExecutor,
                    object : AccessibilityService.TakeScreenshotCallback {
                        override fun onSuccess(result: AccessibilityService.ScreenshotResult) {
                            try {
                                val bitmap = android.graphics.Bitmap.wrapHardwareBuffer(
                                    result.hardwareBuffer,
                                    result.colorSpace
                                )
                                if (bitmap != null) {
                                    saveScreenshotToDisk(service, bitmap, path)
                                    bitmap.recycle()
                                }
                                result.hardwareBuffer.close()
                            } catch (e: Exception) {
                                Log.e(TAG, "Error processing screenshot", e)
                            }
                            cont.resumeWith(Result.success(Unit))
                        }

                        override fun onFailure(errorCode: Int) {
                            Log.e(TAG, "Screenshot failed: $errorCode")
                            cont.resumeWith(Result.success(Unit))
                        }
                    }
                )
            }
        } else {
            Log.i(TAG, "Screenshot fallback to MediaProjection")
            displayRecorder.takeScreenshot { bitmap ->
                saveScreenshotToDisk(service, bitmap, path)
            }
        }
    }

    private fun saveScreenshotToDisk(context: Context, bitmap: Bitmap, path: String?) {
        val timestamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(Date())
        val filename = "Screenshot_$timestamp.png"

        val subFolder = if (path.isNullOrBlank()) {
            "SmartAutoClicker"
        } else {
            path.trim('/', ' ')
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val contentValues = ContentValues().apply {
                put(MediaStore.MediaColumns.DISPLAY_NAME, filename)
                put(MediaStore.MediaColumns.MIME_TYPE, "image/png")
                put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/" + subFolder)
            }

            val resolver = context.contentResolver
            val uri = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, contentValues)
            if (uri != null) {
                try {
                    resolver.openOutputStream(uri)?.use { stream ->
                        bitmap.compress(Bitmap.CompressFormat.PNG, 100, stream)
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to save screenshot", e)
                    resolver.delete(uri, null, null)
                }
            }
        } else {
            val picturesDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES)
            val screenshotDir = File(picturesDir, subFolder)
            if (!screenshotDir.exists()) {
                screenshotDir.mkdirs()
            }

            val screenshotFile = File(screenshotDir, filename)
            try {
                FileOutputStream(screenshotFile).use { stream ->
                    bitmap.compress(Bitmap.CompressFormat.PNG, 100, stream)
                }
                MediaScannerConnection.scanFile(context, arrayOf(screenshotFile.absolutePath), null, null)
            } catch (e: Exception) {
                Log.e(TAG, "Failed to save screenshot legacy", e)
            }
        }
    }

    override fun dump(writer: PrintWriter, prefix: CharSequence) {
        gestureExecutor.dump(writer, prefix)
    }
}

private const val TAG = "ServiceActionExecutor"