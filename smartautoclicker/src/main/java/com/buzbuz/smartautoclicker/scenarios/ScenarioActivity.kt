/*
 * Copyright (C) 2023 Kevin Buzeau
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
package com.buzbuz.smartautoclicker.scenarios

import android.content.DialogInterface
import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.activity.enableEdgeToEdge

import androidx.activity.result.ActivityResult
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.launch

import com.buzbuz.smartautoclicker.R
import com.buzbuz.smartautoclicker.scenarios.list.ScenarioListFragment
import com.buzbuz.smartautoclicker.scenarios.list.model.ScenarioListUiState
import com.buzbuz.smartautoclicker.core.base.extensions.delayDrawUntil
import com.buzbuz.smartautoclicker.core.display.recorder.showMediaProjectionWarning
import com.buzbuz.smartautoclicker.core.domain.model.scenario.Scenario
import com.buzbuz.smartautoclicker.core.dumb.domain.model.DumbScenario
import com.buzbuz.smartautoclicker.feature.revenue.UserConsentState
import com.buzbuz.smartautoclicker.scenarios.viewmodel.ScenarioViewModel

import com.google.android.material.dialog.MaterialAlertDialogBuilder
import dagger.hilt.android.AndroidEntryPoint

/**
 * Entry point activity for the application.
 * Shown when the user clicks on the launcher icon for the application, this activity will displays the list of
 * available scenarios, if any.
 */
@AndroidEntryPoint
class ScenarioActivity : AppCompatActivity(), ScenarioListFragment.Listener {

    companion object {
        const val ACTION_START_SCENARIO = "com.buzbuz.smartautoclicker.action.START_SCENARIO"
        const val EXTRA_SCENARIO_ID = "SCENARIO_ID"
        const val EXTRA_SCENARIO_NAME = "SCENARIO_NAME"
        
        /** Tag for the logs. */
        private const val TAG = "ScenarioActivity"
    }

    private val scenarioViewModel: ScenarioViewModel by viewModels()

    /** The result launcher for the projection permission dialog. */
    private lateinit var projectionActivityResult: ActivityResultLauncher<Intent>

    /** Scenario clicked by the user. */
    private var requestedItem: ScenarioListUiState.Item.ScenarioItem? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_scenario)

        if (intent?.action == ACTION_START_SCENARIO) {
            val scenarioId = intent.getLongExtra(EXTRA_SCENARIO_ID, -1L)
            val scenarioName = intent.getStringExtra(EXTRA_SCENARIO_NAME)

            if (scenarioId != -1L || scenarioName != null) {
                lifecycleScope.launch {
                    var smartScenario: Scenario? = null
                    var dumbScenario: DumbScenario? = null

                    if (scenarioId != -1L) {
                        smartScenario = scenarioViewModel.getSmartScenarioById(scenarioId)
                        dumbScenario = scenarioViewModel.getDumbScenarioById(scenarioId)
                    } else if (scenarioName != null) {
                        smartScenario = scenarioViewModel.getSmartScenarioByName(scenarioName)
                        dumbScenario = scenarioViewModel.getDumbScenarioByName(scenarioName)
                    }

                    when {
                        smartScenario != null -> startScenario(
                            ScenarioListUiState.Item.ScenarioItem.Empty.Smart(smartScenario, 0, 0)
                        )
                        dumbScenario != null -> startScenario(
                            ScenarioListUiState.Item.ScenarioItem.Empty.Dumb(dumbScenario, 0, 0)
                        )
                        else -> Toast.makeText(this@ScenarioActivity, R.string.toast_scenario_not_found, Toast.LENGTH_SHORT).show()
                    }
                }
                return
            }
        }

        scenarioViewModel.stopScenario()
        scenarioViewModel.requestUserConsentIfNeeded(this)

        projectionActivityResult = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
            if (result.resultCode != RESULT_OK) {
                Toast.makeText(this, R.string.toast_denied_screen_sharing_permission, Toast.LENGTH_SHORT).show()
            } else {
                (requestedItem?.scenario as? Scenario)?.let { scenario ->
                    startSmartScenario(result, scenario)
                }
            }
        }

        // Splash screen is dismissed on first frame drawn, delay it until we have a user consent status
        findViewById<View>(android.R.id.content).delayDrawUntil {
            scenarioViewModel.userConsentState.value != UserConsentState.UNKNOWN
        }
    }

    override fun onResume() {
        super.onResume()
        scenarioViewModel.refreshPurchaseState()
    }

    override fun startScenario(item: ScenarioListUiState.Item.ScenarioItem) {
        requestedItem = item

        scenarioViewModel.startPermissionFlowIfNeeded(
            activity = this,
            onAllGranted = ::onMandatoryPermissionsGranted,
        )
    }

    private fun onMandatoryPermissionsGranted() {
        scenarioViewModel.startTroubleshootingFlowIfNeeded(this) {
            when (val scenario = requestedItem?.scenario) {
                is DumbScenario -> startDumbScenario(scenario)
                is Scenario -> projectionActivityResult.showMediaProjectionWarning(
                    context = this,
                    forceEntireScreen = scenarioViewModel.isEntireScreenCaptureForced(),
                    onError = { showUnsupportedDeviceDialog() },
                )
            }
        }
    }

    /**
     * Some devices messes up too much with Android.
     * Display a dialog in those cases and stop the application.
     */
    private fun showUnsupportedDeviceDialog() {
        MaterialAlertDialogBuilder(this)
            .setTitle(R.string.dialog_overlay_title_warning)
            .setMessage(R.string.message_error_screen_capture_permission_dialog_not_found)
            .setPositiveButton(android.R.string.ok) { _: DialogInterface, _: Int ->
                finish()
            }
            .setNegativeButton(android.R.string.cancel, null)
            .create()
            .show()
    }

    private fun startDumbScenario(scenario: DumbScenario) {
        handleScenarioStartResult(scenarioViewModel.loadDumbScenario(
            context = this,
            scenario = scenario,
        ))
    }

    private fun startSmartScenario(result: ActivityResult, scenario: Scenario) {
        handleScenarioStartResult(scenarioViewModel.loadSmartScenario(
            context = this,
            resultCode = result.resultCode,
            data = result.data!!,
            scenario = scenario,
        ))
    }

    private fun handleScenarioStartResult(result: Boolean) {
        if (result) finish()
        else Toast.makeText(this, R.string.toast_denied_foreground_permission, Toast.LENGTH_SHORT).show()
    }
}
