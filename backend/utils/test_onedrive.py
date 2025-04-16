import os
from onedrive import OneDriveManager

def test_authentication():
    """Test if OneDrive authentication works"""
    print("Testing OneDrive authentication...")
    
    try:
        manager = OneDriveManager()
        print("✓ Authentication successful!")
        return manager
    except Exception as e:
        print(f"✗ Authentication failed: {e}")
        return None

def test_list_folders(manager):
    """Test listing folders in OneDrive root"""
    print("\nTesting folder listing...")
    
    try:
        folders = manager.list_folders()
        if folders:
            print(f"✓ Successfully retrieved {len(folders)} folders:")
            for folder in folders:
                print(f"  - {folder['name']} (ID: {folder['id']})")
        else:
            print("✓ No folders found in root (this might be normal)")
        return folders
    except Exception as e:
        print(f"✗ Failed to list folders: {e}")
        return None

def test_file_upload(manager, test_file_path=None):
    """Test uploading a file to OneDrive"""
    print("\nTesting file upload...")
    
    if not test_file_path:
        # Create a simple test file if none provided
        test_file_path = os.path.join(os.path.dirname(__file__), "test_upload.txt")
        with open(test_file_path, "w") as f:
            f.write("This is a test file for OneDrive upload.")
        print(f"Created test file at: {test_file_path}")
    
    try:
        print(f"Uploading file: {os.path.basename(test_file_path)}")
        result = manager.upload_file(test_file_path)
        
        if result:
            print(f"✓ File upload successful!")
            print(f"  - File ID: {result['id']}")
            print(f"  - File name: {result['name']}")
            print(f"  - Web URL: {result.get('webUrl', 'N/A')}")
            
            # Test sharing link creation
            print("\nTesting share link creation...")
            share_link = manager.get_shared_link(result['id'])
            
            if share_link:
                print(f"✓ Share link created successfully:")
                print(f"  - {share_link}")
            else:
                print("✗ Failed to create share link")
                
            return result
        else:
            print("✗ File upload returned no result")
            return None
    except Exception as e:
        print(f"✗ Upload failed: {e}")
        return None
    finally:
        # Clean up the test file if we created it
        if not test_file_path and os.path.exists(test_file_path):
            os.remove(test_file_path)

def test_upload_to_folder(manager, folders):
    """Test uploading to a specific folder"""
    if not folders:
        print("\nNo folders available to test folder upload")
        return
    
    print("\nTesting upload to specific folder...")
    
    # Create test file
    test_file_path = os.path.join(os.path.dirname(__file__), "test_folder_upload.txt")
    with open(test_file_path, "w") as f:
        f.write("This is a test file for OneDrive folder upload.")
    
    try:
        # Pick first folder for testing
        folder = folders[0]
        print(f"Uploading to folder: {folder['name']} (ID: {folder['id']})")
        
        result = manager.upload_file(test_file_path, folder['id'])
        
        if result:
            print(f"✓ Folder upload successful!")
            print(f"  - File ID: {result['id']}")
            print(f"  - File name: {result['name']}")
            print(f"  - Web URL: {result.get('webUrl', 'N/A')}")
            return result
        else:
            print("✗ Folder upload returned no result")
            return None
    except Exception as e:
        print(f"✗ Folder upload failed: {e}")
        return None
    finally:
        if os.path.exists(test_file_path):
            os.remove(test_file_path)

def test_shared_link(manager):
    """Test creating a shared link directly"""
    print("\nTesting shared link creation independently...")
    
    # First upload a test file to get an item ID
    test_file_path = os.path.join(os.path.dirname(__file__), "test_share_link.txt")
    with open(test_file_path, "w") as f:
        f.write("This is a test file for OneDrive share link testing.")
    
    try:
        # Upload the test file first
        print("Uploading test file for sharing...")
        upload_result = manager.upload_file(test_file_path)
        
        if not upload_result:
            print("✗ File upload failed, cannot test sharing")
            return None
        
        item_id = upload_result['id']
        print(f"File uploaded successfully with ID: {item_id}")
        
        # Test the share link function directly
        print("Creating share link...")
        share_link = manager.get_shared_link(item_id)
        
        if share_link:
            print(f"✓ Share link created successfully:")
            print(f"  - {share_link}")
            return share_link
        else:
            print("✗ Failed to create share link")
            return None
    except Exception as e:
        print(f"✗ Share link test failed: {e}")
        return None
    finally:
        if os.path.exists(test_file_path):
            os.remove(test_file_path)

def main():
    """Run all tests"""
    print("=== OneDrive Manager Tests ===\n")
    
    # Test 1: Authentication
    manager = test_authentication()
    if not manager:
        print("\n❌ Authentication failed. Cannot continue with other tests.")
        return
    
    # Test 2: List folders
    folders = test_list_folders(manager)
    
    # Test 3: File upload to root
    upload_result = test_file_upload(manager)
    
    # Test 4: Upload to specific folder (if folders exist)
    if folders:
        folder_upload_result = test_upload_to_folder(manager, folders)

    # New Test 5: Test shared link creation specifically
    share_link_result = test_shared_link(manager)
    
    print("\n=== Test Summary ===")
    print("✓ Authentication: Success")
    print(f"✓ Folder listing: {'Success' if folders is not None else 'Failed'}")
    print(f"✓ Root upload: {'Success' if upload_result else 'Failed'}")
    if folders:
        print(f"✓ Folder upload: {'Success' if folder_upload_result else 'Failed'}")
    print(f"✓ Share link creation: {'Success' if share_link_result else 'Failed'}")

    
    print("\nTests completed.")

if __name__ == "__main__":
    main()