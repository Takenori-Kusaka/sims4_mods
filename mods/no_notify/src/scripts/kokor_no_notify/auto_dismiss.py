"""
Kokor No Notify - Auto Dismiss Module

Automatically responds to interrupting dialogs, notifications, and phone calls
to maintain uninterrupted gameplay.

Features:
1. Auto-respond to "go to work/school together" dialogs (send alone)
2. Auto-respond to visit requests (decline)
3. Auto-dismiss phone call dialogs
4. Auto-dismiss other interrupting dialog popups
5. Preserve game speed when phone rings (prevent slowdown)

Architecture:
- Module-level monkey-patching on game load
- Hooks UiDialogOkCancel.show_dialog for two-button dialogs
- Hooks UiDialogOk.show_dialog for single-button acknowledgments
- Hooks UiDialogNotification.show_dialog for notification popups
- Hooks game clock to preserve speed during auto-dismiss
- Cheat commands for runtime configuration

Python 3.7 compatible (Sims 4 runtime constraint).
"""

import services
import sims4.log
import sims4.commands

logger = sims4.log.Logger('KokorNoNotify', default_owner='kokor')


# ============================================================
# Configuration
# ============================================================

_config = {
    'enabled': True,
    'auto_dismiss_ok_cancel': True,   # Two-button dialogs (career, visit, etc.)
    'auto_dismiss_ok': True,          # Single-button acknowledgment dialogs
    'auto_dismiss_notification': True, # Notification popups
    'preserve_game_speed': True,      # Prevent speed change on phone/dialog
}


# ============================================================
# Hook storage
# ============================================================

_originals = {}
_hooks_installed = False


# ============================================================
# Dialog classification
# ============================================================

# Dialog class names that should NEVER be auto-dismissed
EXCLUDED_DIALOG_CLASSES = frozenset({
    'UiDialogTextInput',
    'UiDialogTextInputOkCancel',
    'UiDialogMultiPicker',
    'UiCasItemPicker',
    'UiObjectPicker',
    'UiSimPicker',
    'UiPurchasePicker',
    'UiCareerPicker',
    'UiDialogResponse',
})


def _should_auto_dismiss(dialog):
    """Check if a dialog should be auto-dismissed.

    Returns False for dialogs that are:
    - Text input dialogs
    - Picker dialogs (CAS, object, sim, etc.)
    - Other player-initiated selection dialogs
    """
    if not _config['enabled']:
        return False

    class_name = type(dialog).__name__

    # Check exact class name exclusion
    if class_name in EXCLUDED_DIALOG_CLASSES:
        return False

    # Check inheritance-based exclusion
    try:
        # Exclude text input dialogs (any subclass)
        from ui.ui_dialog_generic import UiDialogTextInput
        if isinstance(dialog, UiDialogTextInput):
            return False
    except (ImportError, Exception):
        pass

    try:
        # Exclude picker dialogs
        from ui.ui_dialog_picker import UiDialogObjectPicker
        if isinstance(dialog, UiDialogObjectPicker):
            return False
    except (ImportError, Exception):
        pass

    return True


# ============================================================
# Game speed preservation
# ============================================================

_speed_before_dialog = None


def _save_game_speed():
    """Save current game speed before auto-dismissing a dialog."""
    global _speed_before_dialog
    if not _config['preserve_game_speed']:
        return
    try:
        clock_service = services.game_clock_service()
        if clock_service is not None:
            _speed_before_dialog = clock_service.clock_speed
    except Exception:
        pass


def _restore_game_speed():
    """Restore game speed after auto-dismissing a dialog."""
    global _speed_before_dialog
    if not _config['preserve_game_speed']:
        return
    if _speed_before_dialog is None:
        return
    try:
        clock_service = services.game_clock_service()
        if clock_service is not None:
            current_speed = clock_service.clock_speed
            if current_speed != _speed_before_dialog:
                clock_service.set_clock_speed(_speed_before_dialog)
                logger.info('Restored game speed from {} to {}',
                            current_speed, _speed_before_dialog)
    except Exception as e:
        logger.warn('Failed to restore game speed: {}', e)
    finally:
        _speed_before_dialog = None


# ============================================================
# Dialog hooks
# ============================================================

def _patched_ok_cancel_show(self, *args, **kwargs):
    """Hook for UiDialogOkCancel.show_dialog.

    Auto-responds to two-button dialogs with ButtonType.DIALOG_RESPONSE_OK.
    Covers: career travel ("go together"/"send alone"), visit requests,
    phone prompts, chance cards, and other interrupting choice dialogs.
    """
    if not _config['auto_dismiss_ok_cancel'] or not _should_auto_dismiss(self):
        return _originals['ok_cancel_show'](self, *args, **kwargs)

    try:
        from ui.ui_dialog import ButtonType
        class_name = type(self).__name__
        _save_game_speed()
        logger.info('Auto-dismiss OkCancel [{}]', class_name)
        self.respond(ButtonType.DIALOG_RESPONSE_OK)
        _restore_game_speed()
        return
    except Exception as e:
        logger.warn('Auto-dismiss OkCancel failed [{}]: {}',
                     type(self).__name__, e)

    return _originals['ok_cancel_show'](self, *args, **kwargs)


def _patched_ok_show(self, *args, **kwargs):
    """Hook for UiDialogOk.show_dialog.

    Auto-acknowledges single-button dialogs.
    Covers: informational popups that require an OK click.
    """
    if not _config['auto_dismiss_ok'] or not _should_auto_dismiss(self):
        return _originals['ok_show'](self, *args, **kwargs)

    try:
        from ui.ui_dialog import ButtonType
        class_name = type(self).__name__
        _save_game_speed()
        logger.info('Auto-dismiss Ok [{}]', class_name)
        self.respond(ButtonType.DIALOG_RESPONSE_OK)
        _restore_game_speed()
        return
    except Exception as e:
        logger.warn('Auto-dismiss Ok failed [{}]: {}',
                     type(self).__name__, e)

    return _originals['ok_show'](self, *args, **kwargs)


def _patched_notification_show(self, *args, **kwargs):
    """Hook for UiDialogNotification.show_dialog.

    Auto-dismisses notification popups (phone calls, event alerts, etc.).
    """
    if not _config['auto_dismiss_notification'] or not _should_auto_dismiss(self):
        return _originals['notification_show'](self, *args, **kwargs)

    try:
        class_name = type(self).__name__
        _save_game_speed()
        logger.info('Auto-dismiss notification [{}]', class_name)
        # Notifications use response ID 0 for dismissal
        self.respond(0)
        _restore_game_speed()
        return
    except Exception as e:
        logger.warn('Auto-dismiss notification failed [{}]: {}',
                     type(self).__name__, e)

    return _originals['notification_show'](self, *args, **kwargs)


# ============================================================
# Phone-specific hooks
# ============================================================

def _install_phone_hooks():
    """Install hooks specific to phone call handling."""
    # Hook the phone ring dialog to prevent game speed change
    try:
        from situations.situation_phone_ring import PhoneRingSituation
        if hasattr(PhoneRingSituation, '_on_phone_ring'):
            _originals['phone_ring'] = PhoneRingSituation._on_phone_ring

            def _patched_phone_ring(self_sit, *args, **kwargs):
                if _config['enabled'] and _config['preserve_game_speed']:
                    _save_game_speed()

                result = _originals['phone_ring'](self_sit, *args, **kwargs)

                if _config['enabled'] and _config['preserve_game_speed']:
                    _restore_game_speed()

                return result

            PhoneRingSituation._on_phone_ring = _patched_phone_ring
            logger.info('Hooked PhoneRingSituation._on_phone_ring')
    except (ImportError, AttributeError, Exception) as e:
        logger.info('PhoneRingSituation hook skipped: {}', e)

    # Hook into the phone service to prevent speed changes
    try:
        import phone.phone
        if hasattr(phone.phone, 'Phone') and hasattr(phone.phone.Phone, 'ring'):
            _originals['phone_ring_method'] = phone.phone.Phone.ring

            def _patched_phone_method_ring(self_phone, *args, **kwargs):
                if _config['enabled'] and _config['preserve_game_speed']:
                    _save_game_speed()

                result = _originals['phone_ring_method'](
                    self_phone, *args, **kwargs)

                if _config['enabled'] and _config['preserve_game_speed']:
                    _restore_game_speed()

                return result

            phone.phone.Phone.ring = _patched_phone_method_ring
            logger.info('Hooked Phone.ring')
    except (ImportError, AttributeError, Exception) as e:
        logger.info('Phone.ring hook skipped: {}', e)


# ============================================================
# Cheat commands
# ============================================================

@sims4.commands.Command(
    'kokor_no_notify.toggle',
    command_type=sims4.commands.CommandType.Live)
def _cmd_toggle(_connection=None):
    """Toggle the entire mod on/off."""
    _config['enabled'] = not _config['enabled']
    output = sims4.commands.CheatOutput(_connection)
    state = 'ON' if _config['enabled'] else 'OFF'
    output('Kokor No Notify: {}'.format(state))


@sims4.commands.Command(
    'kokor_no_notify.status',
    command_type=sims4.commands.CommandType.Live)
def _cmd_status(_connection=None):
    """Show current configuration status."""
    output = sims4.commands.CheatOutput(_connection)
    output('=== Kokor No Notify ===')
    output('  Enabled:         {}'.format(_config['enabled']))
    output('  OkCancel dialog: {}'.format(_config['auto_dismiss_ok_cancel']))
    output('  Ok dialog:       {}'.format(_config['auto_dismiss_ok']))
    output('  Notifications:   {}'.format(_config['auto_dismiss_notification']))
    output('  Speed guard:     {}'.format(_config['preserve_game_speed']))


@sims4.commands.Command(
    'kokor_no_notify.dialogs',
    command_type=sims4.commands.CommandType.Live)
def _cmd_toggle_dialogs(_connection=None):
    """Toggle auto-dismiss for OkCancel dialogs."""
    _config['auto_dismiss_ok_cancel'] = not _config['auto_dismiss_ok_cancel']
    output = sims4.commands.CheatOutput(_connection)
    state = 'ON' if _config['auto_dismiss_ok_cancel'] else 'OFF'
    output('Auto-dismiss OkCancel dialogs: {}'.format(state))


@sims4.commands.Command(
    'kokor_no_notify.notifications',
    command_type=sims4.commands.CommandType.Live)
def _cmd_toggle_notifications(_connection=None):
    """Toggle auto-dismiss for notifications."""
    _config['auto_dismiss_notification'] = not _config['auto_dismiss_notification']
    output = sims4.commands.CheatOutput(_connection)
    state = 'ON' if _config['auto_dismiss_notification'] else 'OFF'
    output('Auto-dismiss notifications: {}'.format(state))


@sims4.commands.Command(
    'kokor_no_notify.speed',
    command_type=sims4.commands.CommandType.Live)
def _cmd_toggle_speed(_connection=None):
    """Toggle game speed preservation."""
    _config['preserve_game_speed'] = not _config['preserve_game_speed']
    output = sims4.commands.CheatOutput(_connection)
    state = 'ON' if _config['preserve_game_speed'] else 'OFF'
    output('Game speed guard: {}'.format(state))


@sims4.commands.Command(
    'kokor_no_notify.help',
    command_type=sims4.commands.CommandType.Live)
def _cmd_help(_connection=None):
    """Show available commands."""
    output = sims4.commands.CheatOutput(_connection)
    output('=== Kokor No Notify Commands ===')
    output('  kokor_no_notify.toggle        - Enable/disable mod')
    output('  kokor_no_notify.status        - Show settings')
    output('  kokor_no_notify.dialogs       - Toggle dialog auto-dismiss')
    output('  kokor_no_notify.notifications - Toggle notification auto-dismiss')
    output('  kokor_no_notify.speed         - Toggle game speed guard')
    output('  kokor_no_notify.help          - Show this help')


# ============================================================
# Hook installation
# ============================================================

def _install_dialog_hooks():
    """Install all dialog hooks via monkey-patching."""
    global _hooks_installed
    if _hooks_installed:
        return

    # --- UiDialogOkCancel ---
    try:
        from ui.ui_dialog import UiDialogOkCancel
        _originals['ok_cancel_show'] = UiDialogOkCancel.show_dialog
        UiDialogOkCancel.show_dialog = _patched_ok_cancel_show
        logger.info('Hooked UiDialogOkCancel.show_dialog')
    except Exception as e:
        logger.error('Failed to hook UiDialogOkCancel: {}', e)

    # --- UiDialogOk ---
    try:
        from ui.ui_dialog import UiDialogOk
        _originals['ok_show'] = UiDialogOk.show_dialog
        UiDialogOk.show_dialog = _patched_ok_show
        logger.info('Hooked UiDialogOk.show_dialog')
    except Exception as e:
        logger.error('Failed to hook UiDialogOk: {}', e)

    # --- UiDialogNotification ---
    try:
        from ui.ui_dialog_notification import UiDialogNotification
        _originals['notification_show'] = UiDialogNotification.show_dialog
        UiDialogNotification.show_dialog = _patched_notification_show
        logger.info('Hooked UiDialogNotification.show_dialog')
    except Exception as e:
        logger.warn('Failed to hook UiDialogNotification: {}', e)

    # --- Phone-specific hooks ---
    _install_phone_hooks()

    _hooks_installed = True
    logger.info('All No Notify hooks installed')


# ============================================================
# Module-level initialization
# ============================================================

_install_dialog_hooks()
logger.info('Kokor No Notify module loaded')
