import styles from "./ProfileDropdownMenu.module.css";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { type ProfileDropdownMenuTypes } from "../../types/utility.types";

const ProfileDropdownMenu = ({name, logout, updateUsername }: ProfileDropdownMenuTypes) => {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className={styles.trigger}>
        {name}
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
         className={styles.content}
          sideOffset={8}
          align="end"
        >
          <DropdownMenu.Item className={styles.item} onSelect={updateUsername}>
            Change username
          </DropdownMenu.Item>

          <DropdownMenu.Item className={styles.item} onSelect={logout}>
            Logout
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};

export default ProfileDropdownMenu;
