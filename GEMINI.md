# Project Overview

This is an open-source Android application called Klick'r (formerly Smart AutoClicker). It's designed to automate repetitive tasks using image detection and traditional auto-clicking functionalities. The project is written in Kotlin and built with Gradle.

The project follows a multi-module architecture, separating concerns into `core`, `feature`, and the main `smartautoclicker` application modules. This modular design promotes code reusability and maintainability.

Always build F.droid version.

We have modified the app to expose new adb intent to launch a scenario by its name, or by id. The second modification was adding a screenshot action that saves with a timestamp in the format `dateTtime` to the pictures folder.

The documentation for these features is now available in the `documentation/` folder and the `CHANGELOG.md`.

## Key Technologies

*   **Language:** Kotlin
*   **Build Tool:** Gradle
*   **Architecture:** Multi-module (core, feature, app)
*   **Asynchronous Programming:** Kotlin Coroutines
*   **Dependency Injection:** Hilt
*   **UI:** AndroidX libraries (AppCompat, RecyclerView, Fragment, etc.), Material Components, Lottie for animations.
*   **Data Persistence:** AndroidX DataStore

# Building and Running

## Building the Project

To build the project, you can use the following Gradle command:

```bash
./gradlew build
```

## Running the Project

To install the application on a connected device or emulator, you can use the following Gradle command:

```bash
./gradlew installDebug
```

## Testing the Project

To run the unit tests, you can use the following Gradle command:

```bash
./gradlew test
```

# Development Conventions

*   **Coding Style:** The project follows the standard Kotlin coding conventions.
*   **Testing:** The project includes unit tests, which can be found in the `src/test` directory of each module.
*   **Contribution:** The project has a `CONTRIBUTING.md` file with guidelines for contributing to the project.
*   **Issue Tracking:** Issues are tracked on GitHub. The project provides templates for bug reports and feature requests.
*   **Pull Requests:** Pull requests should be made to the `master` branch and should follow the provided pull request template.
*   **Versioning:** The project uses a semantic versioning scheme. The version is defined in the `smartautoclicker/build.gradle.kts` file.
