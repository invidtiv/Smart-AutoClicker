import subprocess
import sys

# --- Configuration ---
# Defaulting to the debug package based on the project structure.
PACKAGE_NAME = "com.buzbuz.smartautoclicker.debug"
ACTIVITY_NAME = "com.buzbuz.smartautoclicker.scenarios.ScenarioActivity"
ACTION_START_SCENARIO = "com.buzbuz.smartautoclicker.action.START_SCENARIO"
ACCESSIBILITY_SERVICE_COMPONENT = f"{PACKAGE_NAME}/com.buzbuz.smartautoclicker.SmartAutoClickerService"

def run_adb_command(command):
    """Executes a shell command and returns the output."""
    try:
        result = subprocess.run(
            command, 
            shell=True, 
            check=True, 
            stdout=subprocess.PIPE, 
            stderr=subprocess.PIPE, 
            text=True
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        print(f"Error executing command: {command}")
        print(f"Stderr: {e.stderr}")
        return None

def main():
    print(f"=== Smart AutoClicker Scenario Tester ===")
    print(f"Target Package: {PACKAGE_NAME}")
    print(f"Intent Action:  {ACTION_NAME}")
    print(f"Test Range:     IDs 1 to 11")
    print("=" * 40)

    # Check for ADB presence
    print("Checking ADB connection...")
    devices = run_adb_command("adb devices")
    if not devices or "device" not in devices.replace("List of devices attached", "").strip():
        print("Error: No ADB devices found. Please connect a device or emulator.")
        return

    # Enable Accessibility Service
    print(f"\nEnabling Accessibility Service: {ACCESSIBILITY_SERVICE_COMPONENT}")
    enable_accessibility_cmd = f"adb shell settings put secure enabled_accessibility_services {ACCESSIBILITY_SERVICE_COMPONENT}"
    run_adb_command(enable_accessibility_cmd)
    
    # Ensure accessibility is turned on (might be needed for some devices/Android versions)
    turn_on_accessibility_cmd = "adb shell settings put secure accessibility_enabled 1"
    run_adb_command(turn_on_accessibility_cmd)
    
    print("Accessibility service command sent. Please ensure it is enabled in your device settings if issues persist.")

    try:
        for scenario_id in range(1, 12): # 1 to 11 inclusive
            print(f"\n--- Testing Scenario ID: {scenario_id} ---")
            
            # Construct the ADB command
            # -a: action
            # --el: extra long (key value)
            # -n: component (package/class) to be explicit
            cmd = (
                f"adb shell am start "
                f"-a {ACTION_NAME} "
                f"-n {PACKAGE_NAME}/{ACTIVITY_NAME} "
                f"--el SCENARIO_ID {scenario_id}"
            )
            
            print(f"Running: {cmd}")
            run_adb_command(cmd)
            
            # Wait for user confirmation
            input(f"> Scenario {scenario_id} launched. Press Enter to continue to the next ID...")

    except KeyboardInterrupt:
        print("\n\nTest cancelled by user.")
        sys.exit(0)

    print("\n=== Test Sequence Completed ===")
if __name__ == "__main__":
    main()
