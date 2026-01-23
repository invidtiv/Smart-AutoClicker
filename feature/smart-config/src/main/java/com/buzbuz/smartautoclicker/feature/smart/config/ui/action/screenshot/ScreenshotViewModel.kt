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
package com.buzbuz.smartautoclicker.feature.smart.config.ui.action.screenshot

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.buzbuz.smartautoclicker.core.domain.model.action.Screenshot
import com.buzbuz.smartautoclicker.feature.smart.config.domain.EditionRepository
import com.buzbuz.smartautoclicker.feature.smart.config.R
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.mapNotNull
import kotlinx.coroutines.flow.stateIn
import javax.inject.Inject

class ScreenshotViewModel @Inject constructor(
    private val editionRepository: EditionRepository,
) : ViewModel() {

    private val editedActionState = editionRepository.editionState.editedActionState

    private val editedAction: Flow<Screenshot> = editedActionState
        .mapNotNull { it.value as? Screenshot }

    val name: Flow<String> = editedAction.mapNotNull { it.name }
    
    val nameError: Flow<Int?> = name.map { if (it.isEmpty()) R.string.item_error_action_invalid_generic else null }

    val path: Flow<String?> = editedAction.map { it.path }

    val isEditingAction: Flow<Boolean> = editionRepository.isEditingAction
        .stateIn(viewModelScope, SharingStarted.Eagerly, true)

    val isValidAction: Flow<Boolean> = editedActionState.map { it.canBeSaved }

    private val editedActionHasChanged: kotlinx.coroutines.flow.StateFlow<Boolean> = editedActionState
        .map { it.hasChanged }
        .stateIn(viewModelScope, SharingStarted.Eagerly, false)

    fun setName(name: String) {
        val currentAction = editionRepository.editionState.getEditedAction<Screenshot>() ?: return
        editionRepository.updateEditedAction(currentAction.copy(name = name))
    }

    fun setPath(path: String?) {
        val currentAction = editionRepository.editionState.getEditedAction<Screenshot>() ?: return
        editionRepository.updateEditedAction(currentAction.copy(path = path))
    }

    fun hasUnsavedModifications(): Boolean = editedActionHasChanged.value
}
