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
package com.buzbuz.smartautoclicker.core.domain.model.action

import com.buzbuz.smartautoclicker.core.base.identifier.DATABASE_ID_INSERTION
import com.buzbuz.smartautoclicker.core.base.identifier.Identifier

/**
 * Action allowing to take a screenshot and save it.
 *
 * @param id the unique identifier of this action.
 * @param eventId the identifier of the event for this action.
 * @param name the name of the action.
 * @param priority the execution priority of this action.
 */
data class Screenshot(
    override val id: Identifier = Identifier(databaseId = DATABASE_ID_INSERTION),
    override val eventId: Identifier = Identifier(databaseId = DATABASE_ID_INSERTION),
    override val name: String? = null,
    override var priority: Int = 0,
) : Action() {

    override fun hashCodeNoIds(): Int =
        31 * (name?.hashCode() ?: 0) +
                31 * priority

    override fun deepCopy(): Action = copy(
        id = Identifier(databaseId = DATABASE_ID_INSERTION),
        eventId = Identifier(databaseId = DATABASE_ID_INSERTION),
    )
}
