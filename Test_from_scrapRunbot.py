#!/usr/bin/env python3
"""
Standalone ADB Command Test Module
Tests ADB commands for SmartAutoClicker debug version and file operations
Not connected to main bot - can be run independently

Usage: python test_adb_commands.py
"""

import subprocess
import time
import os
import sys
from datetime import datetime
import re

# ================== CONFIGURATION ==================
# ADB Configuration
ADB_PATH = r"C:\Android\SDK\platform-tools\adb.exe"
VM_SERIAL = "emulator-5564"  # Default serial, will be overridden if device selected

# Package configurations
SMARTAUTOCLICKER_DEBUG_PACKAGE = "com.buzbuz.smartautoclicker.debug"
SMARTAUTOCLICKER_ORIGINAL_PACKAGE = "com.buzbuz.smartautoclicker"
CATS_PACKAGE = "com.zeptolab.cats.google"
CYANOGEN_PACKAGE = "com.cyanogenmod.filemanager"
CYANOGEN_ACTIVITY = "com.cyanogenmod.filemanager.activities.NavigationActivity"

# Scenario configuration
DEFAULT_SCENARIO_ID = 1

# Intent actions
ACTION_START_SCENARIO = "com.buzbuz.smartautoclicker.ACTION_START_SCENARIO_BY_ID"
EXTRA_SCENARIO_ID = "SCENARIO_ID"
ACTION_PLAY = "com.buzbuz.smartautoclicker.PLAY"

# Test file path (adjust as needed)
TEST_FILE_PATH = "/storage/emulated/0/TeamFiles/BS1/Test.TiBkp"

# ================== UTILITY FUNCTIONS ==================

def print_header(text):
    """Print a formatted header."""
    print("\n" + "=" * 60)
    print(f"  {text}")
    print("=" * 60)

def print_step(step_num, description):
    """Print a formatted step."""
    print(f"\n[Step {step_num}] {description}")
    print("-" * 50)

def run_adb_command(command, description="", capture_output=True):
    """
    Run an ADB command and return the result.
    
    Args:
        command: List of command arguments (without adb path and serial)
        description: Description of what the command does
        capture_output: Whether to capture output
        
    Returns:
        Tuple of (success, stdout, stderr)
    """
    full_command = [ADB_PATH, "-s", VM_SERIAL] + command
    
    if description:
        print(f"  → {description}")
    print(f"  Command: {' '.join(full_command)}")
    
    try:
        result = subprocess.run(
            full_command,
            capture_output=capture_output,
            text=True,
            timeout=30
        )
        
        success = result.returncode == 0
        status = "✓ SUCCESS" if success else "✗ FAILED"
        print(f"  Status: {status}")
        
        if capture_output:
            if result.stdout and result.stdout.strip():
                print(f"  Output: {result.stdout.strip()[:200]}")
            if result.stderr and result.stderr.strip():
                print(f"  Error: {result.stderr.strip()}")
                
        return success, result.stdout if capture_output else "", result.stderr if capture_output else ""
        
    except subprocess.TimeoutExpired:
        print("  Status: ✗ TIMEOUT")
        return False, "", "Command timed out"
    except Exception as e:
        print(f"  Status: ✗ EXCEPTION - {str(e)}")
        return False, "", str(e)

def list_adb_devices():
    """List all connected ADB devices."""
    print("\nScanning for ADB devices...")
    try:
        result = subprocess.run(
            [ADB_PATH, "devices", "-l"],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if result.returncode == 0:
            lines = result.stdout.strip().split('\n')
            devices = []
            
            for line in lines[1:]:  # Skip header
                if line.strip():
                    parts = line.split()
                    if len(parts) >= 2:
                        serial = parts[0]
                        status = parts[1]
                        model = ""
                        
                        # Extract model if available
                        model_match = re.search(r'model:(\S+)', line)
                        if model_match:
                            model = model_match.group(1)
                        
                        devices.append({
                            'serial': serial,
                            'status': status,
                            'model': model
                        })
            
            return devices
        else:
            print(f"Error listing devices: {result.stderr}")
            return []
            
    except Exception as e:
        print(f"Exception listing devices: {str(e)}")
        return []

def select_device():
    """Allow user to select an ADB device."""
    devices = list_adb_devices()
    
    if not devices:
        print("No devices found! Please connect an Android device or start an emulator.")
        return None
    
    if len(devices) == 1:
        device = devices[0]
        if device['status'] == 'device':
            print(f"Using only available device: {device['serial']} ({device['model']})")
            return device['serial']
        else:
            print(f"Device {device['serial']} is {device['status']}. Cannot use.")
            return None
    
    print("\nAvailable devices:")
    for i, device in enumerate(devices, 1):
        status_icon = "✅" if device['status'] == 'device' else "❌"
        print(f"  {i}. {device['serial']} - {device['model']} {status_icon} ({device['status']})")
    
    while True:
        try:
            choice = input(f"\nSelect device (1-{len(devices)}) or 'q' to quit: ").strip()
            if choice.lower() == 'q':
                return None
            
            idx = int(choice) - 1
            if 0 <= idx < len(devices):
                device = devices[idx]
                if device['status'] == 'device':
                    return device['serial']
                else:
                    print(f"Device is {device['status']}. Please select another.")
            else:
                print("Invalid selection. Please try again.")
        except ValueError:
            print("Invalid input. Please enter a number.")

def check_package_installed(package_name):
    """Check if a package is installed."""
    success, stdout, _ = run_adb_command(
        ["shell", "pm", "list", "packages", package_name],
        f"Checking if {package_name} is installed"
    )
    
    if success and package_name in stdout:
        print(f"  ✓ Package {package_name} is installed")
        return True
    else:
        print(f"  ✗ Package {package_name} is NOT installed")
        return False

def get_scenario_status():
    """Check the current status of SmartAutoClicker scenario."""
    service_name = f"{SMARTAUTOCLICKER_DEBUG_PACKAGE}/.SmartAutoClickerService"
    
    success, stdout, _ = run_adb_command(
        ["shell", "dumpsys", "activity", "service", service_name],
        "Getting SmartAutoClicker service status"
    )
    
    if success:
        # Try to find state in DetectionRepository
        detection_match = re.search(r"DetectionRepository.*?detectionState=(\w+)", stdout, re.DOTALL)
        if detection_match:
            state = detection_match.group(1)
            print(f"  Detection state: {state}")
            return state
        
        # Fallback to DumbEngine.isRunning
        engine_match = re.search(r"DumbEngine.*?isRunning=(\w+)", stdout, re.DOTALL)
        if engine_match:
            is_running = engine_match.group(1).lower() == "true"
            state = "RUNNING" if is_running else "IDLE"
            print(f"  Engine state: {state}")
            return state
    
    print("  Could not determine scenario status")
    return "UNKNOWN"

# ================== TEST FUNCTIONS ==================

def test_force_stop_apps():
    """Test 1: Force stop all relevant apps."""
    print_step(1, "Force Stopping Apps")
    
    apps = [
        (CATS_PACKAGE, "Cats game"),
        (SMARTAUTOCLICKER_DEBUG_PACKAGE, "SmartAutoClicker Debug"),
        (SMARTAUTOCLICKER_ORIGINAL_PACKAGE, "SmartAutoClicker Original")
    ]
    
    for package, name in apps:
        run_adb_command(
            ["shell", "am", "force-stop", package],
            f"Force stopping {name}"
        )
        time.sleep(0.5)

def test_grant_permissions():
    """Test 2: Grant permissions to SmartAutoClicker."""
    print_step(2, "Granting Permissions to SmartAutoClicker Debug")
    
    # Common permissions that SmartAutoClicker might need
    permissions = [
        "android.permission.SYSTEM_ALERT_WINDOW",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.READ_EXTERNAL_STORAGE"
    ]
    
    for permission in permissions:
        run_adb_command(
            ["shell", "pm", "grant", SMARTAUTOCLICKER_DEBUG_PACKAGE, permission],
            f"Granting {permission.split('.')[-1]}"
        )
        time.sleep(0.2)
    
    # Enable accessibility service
    print("\n  Enabling accessibility service...")
    service_name = f"{SMARTAUTOCLICKER_DEBUG_PACKAGE}/.SmartAutoClickerService"
    
    # First, get current enabled services
    success, stdout, _ = run_adb_command(
        ["shell", "settings", "get", "secure", "enabled_accessibility_services"],
        "Getting current accessibility services"
    )
    
    if success:
        current_services = stdout.strip()
        if service_name not in current_services:
            # Add our service to the list
            if current_services and current_services != "null":
                new_services = f"{current_services}:{service_name}"
            else:
                new_services = service_name
            
            run_adb_command(
                ["shell", "settings", "put", "secure", "enabled_accessibility_services", new_services],
                "Enabling accessibility service"
            )
            
            # Also set accessibility_enabled to 1
            run_adb_command(
                ["shell", "settings", "put", "secure", "accessibility_enabled", "1"],
                "Enabling accessibility"
            )
        else:
            print("  Accessibility service already enabled")

def test_launch_scenario():
    """Test 3: Launch SmartAutoClicker with specific scenario."""
    print_step(3, f"Launching SmartAutoClicker Debug with Scenario ID {DEFAULT_SCENARIO_ID}")
    
    component = f"{SMARTAUTOCLICKER_DEBUG_PACKAGE}/.scenarios.ScenarioActivity"
    
    success, _, _ = run_adb_command(
        [
            "shell", "am", "start",
            "-a", ACTION_START_SCENARIO,
            "-n", component,
            "--el", EXTRA_SCENARIO_ID, str(DEFAULT_SCENARIO_ID),
            "-f", "0x14000000"  # FLAG_ACTIVITY_NEW_TASK | FLAG_ACTIVITY_CLEAR_TOP
        ],
        f"Starting scenario {DEFAULT_SCENARIO_ID}"
    )
    
    if success:
        print("  Waiting for scenario to load...")
        time.sleep(3)
        
        # Check status
        status = get_scenario_status()
        print(f"  Current status after launch: {status}")
    
    return success

def test_send_play_broadcast():
    """Test 4: Send PLAY broadcast to start automation."""
    print_step(4, "Sending PLAY Broadcast")
    
    success, _, _ = run_adb_command(
        [
            "shell", "am", "broadcast",
            "-a", ACTION_PLAY,
            "-p", SMARTAUTOCLICKER_DEBUG_PACKAGE
        ],
        "Sending PLAY broadcast"
    )
    
    if success:
        print("  Waiting for automation to start...")
        time.sleep(2)
        
        # Check status
        status = get_scenario_status()
        print(f"  Current status after PLAY: {status}")
    
    return success

def test_open_file_with_cyanogen():
    """Test 5: Open a file with Cyanogen file manager."""
    print_step(5, "Opening File with Cyanogen File Manager")
    
    # First check if file exists
    success, stdout, _ = run_adb_command(
        ["shell", "ls", "-la", TEST_FILE_PATH],
        f"Checking if {TEST_FILE_PATH} exists"
    )
    
    if not success or "No such file" in stdout:
        print(f"  ⚠ Test file not found: {TEST_FILE_PATH}")
        print("  Creating a dummy test file...")
        
        # Create directory if needed
        dir_path = os.path.dirname(TEST_FILE_PATH)
        run_adb_command(
            ["shell", "mkdir", "-p", dir_path],
            f"Creating directory {dir_path}"
        )
        
        # Create dummy file
        run_adb_command(
            ["shell", "touch", TEST_FILE_PATH],
            f"Creating test file {TEST_FILE_PATH}"
        )
    
    # Try to open the file
    success, _, _ = run_adb_command(
        [
            "shell", "am", "start",
            "-a", "android.intent.action.VIEW",
            "-d", f"file://{TEST_FILE_PATH}",
            "-t", "application/octet-stream"
        ],
        "Opening file with VIEW intent"
    )
    
    if success:
        print("  File open command sent successfully")
    
    return success

def test_monitor_scenario():
    """Test 6: Monitor scenario execution."""
    print_step(6, "Monitoring Scenario Execution")
    
    print("  Monitoring for 10 seconds...")
    start_time = time.time()
    last_status = None
    
    while time.time() - start_time < 10:
        status = get_scenario_status()
        
        if status != last_status:
            elapsed = time.time() - start_time
            print(f"  [{elapsed:.1f}s] Status changed: {last_status} → {status}")
            last_status = status
        
        time.sleep(2)
    
    print(f"  Final status: {last_status}")

def test_take_screenshot():
    """Test 7: Take a screenshot."""
    print_step(7, "Taking Screenshot")
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    screenshot_name = f"test_screenshot_{timestamp}.png"
    device_path = f"/sdcard/{screenshot_name}"
    local_path = os.path.join(os.getcwd(), screenshot_name)
    
    # Take screenshot on device
    success, _, _ = run_adb_command(
        ["shell", "screencap", "-p", device_path],
        "Capturing screenshot"
    )
    
    if success:
        # Pull screenshot to local machine
        success, _, _ = run_adb_command(
            ["pull", device_path, local_path],
            f"Pulling screenshot to {local_path}"
        )
        
        if success:
            print(f"  ✓ Screenshot saved to: {local_path}")
            
            # Clean up device
            run_adb_command(
                ["shell", "rm", device_path],
                "Cleaning up device screenshot"
            )
    
    return success

def run_full_workflow():
    """Run the complete workflow test."""
    print_header("RUNNING COMPLETE WORKFLOW TEST")
    
    # Check packages first
    print("\nChecking required packages...")
    packages = [
        (SMARTAUTOCLICKER_DEBUG_PACKAGE, "SmartAutoClicker Debug"),
        (CYANOGEN_PACKAGE, "Cyanogen File Manager"),
        (CATS_PACKAGE, "Cats Game")
    ]
    
    for package, name in packages:
        if not check_package_installed(package):
            print(f"  ⚠ Warning: {name} is not installed")
    
    # Run tests
    test_force_stop_apps()
    test_grant_permissions()
    
    if test_launch_scenario():
        test_send_play_broadcast()
        test_open_file_with_cyanogen()
        test_monitor_scenario()
    
    test_take_screenshot()
    
    # Final cleanup
    print_step("Final", "Cleaning Up")
    test_force_stop_apps()

def main():
    """Main function to run the test module."""
    global VM_SERIAL
    
    print_header("ADB COMMAND TEST MODULE")
    print(f"ADB Path: {ADB_PATH}")
    print(f"Default Serial: {VM_SERIAL}")
    print(f"SmartAutoClicker Debug: {SMARTAUTOCLICKER_DEBUG_PACKAGE}")
    print(f"Scenario ID: {DEFAULT_SCENARIO_ID}")
    
    # Device selection
    selected_serial = select_device()
    if not selected_serial:
        print("\nNo device selected. Exiting.")
        return 1
    
    VM_SERIAL = selected_serial
    print(f"\nUsing device: {VM_SERIAL}")
    
    # Menu
    while True:
        print("\n" + "=" * 60)
        print("  TEST OPTIONS")
        print("=" * 60)
        print("  1. Run Full Workflow Test")
        print("  2. Test Force Stop Apps")
        print("  3. Test Grant Permissions")
        print("  4. Test Launch Scenario")
        print("  5. Test Send PLAY Broadcast")
        print("  6. Test Open File with Cyanogen")
        print("  7. Test Monitor Scenario")
        print("  8. Test Take Screenshot")
        print("  9. Check Installed Packages")
        print("  0. Exit")
        print("-" * 60)
        
        choice = input("Select option (0-9): ").strip()
        
        if choice == '0':
            print("\nExiting...")
            break
        elif choice == '1':
            run_full_workflow()
        elif choice == '2':
            test_force_stop_apps()
        elif choice == '3':
            test_grant_permissions()
        elif choice == '4':
            test_launch_scenario()
        elif choice == '5':
            test_send_play_broadcast()
        elif choice == '6':
            test_open_file_with_cyanogen()
        elif choice == '7':
            test_monitor_scenario()
        elif choice == '8':
            test_take_screenshot()
        elif choice == '9':
            print("\nChecking installed packages...")
            for package, name in packages:
                check_package_installed(package)
        else:
            print("Invalid option. Please try again.")
        
        input("\nPress Enter to continue...")
    
    return 0

if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n\nInterrupted by user. Exiting...")
        sys.exit(1)
    except Exception as e:
        print(f"\n\nUnexpected error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
