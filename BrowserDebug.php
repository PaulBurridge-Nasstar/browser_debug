<?php
class BrowserDebug {

  private $log = array();
  private $settings;

  public function __construct() {
    $this->getSettings();
    if ($settings['watchdog'] === 0) {
      $settings['watchdog'] = $this->getWatchdogPosition();
    }
  }

  private function getSettings() {
    $logs = variable_get('browser_debug_logs', array());
    $logs = explode(',', $logs);
    // Make array of with log path as key and 0 as value;
    $logs = array_combine($logs, array_pad(array(), count($logs), 0));
    $settings = variable_get('browser_debug_settings', array());
    // Create default array structure.
    $default = array('watchdog' => 0, 'logs' => $logs);
    // Add missing.
    $settings = array_replace_recursive($default, $settings);
    // Remove extra.
    $settings['logs'] = array_intersect_key($settings['logs'], $logs);
    $this->log($settings['watchdog'], 'settings.watchdog (get)');
    $this->log($settings['logs'], 'settings.logs (get)');
    $this->settings = $settings;
  }

  private function saveSettings() {
    $this->log($this->settings['watchdog'], 'settings.watchdog (set)');
    $this->log($this->settings['logs'], 'settings.logs (set)');
    variable_set('browser_debug_settings', $this->settings);
  }

  public function log($item, $label) {
    switch (TRUE) {
      case empty($label):
        $this->log[] = $item;
        break;

      case is_string($item):
        $this->log[] = $label . ': ' . $item;
        break;

      default:
        $this->log[] = $label . ':';
        $this->log[] = $item;
        break;
    }
  }

  public function getAllData() {
    $data = array(
      'session' => $this->getSession(),
      'watchdog' => $this->getWatchdogLog(),
    );
    $this->saveSettings();
    // Add log, done as last step to enable internal logging until the last moment!
    $data['log'] = $this->log;
    return $data;
  }

  public function getWatchdogPosition() {
    $wid = (int) db_query('select max(wid) from watchdog;')->fetchField();
    return $wid;
  }

  private function getWatchdogLog() {
    $wid = $this->getWatchdogPosition();
    $last_wid = $this->settings['watchdog'];
    $this->settings['watchdog'] = $wid;

    $query = db_select('watchdog', 'w')->extend('PagerDefault')->extend('TableSort');
    $query->leftJoin('users', 'u', 'w.uid = u.uid');
    $query
      ->fields('w', array('wid', 'uid', 'severity', 'type', 'timestamp', 'message', 'variables', 'link'))
      ->addField('u', 'name');

    $result = $query
      ->condition('wid', array($last_wid, $wid), 'BETWEEN')
      ->limit(500)
      ->orderBy('wid', 'desc')
      ->execute();

    $rows = array();
    foreach ($result as $dblog) {

      $serialized_false = serialize(FALSE);
      @$vars = unserialize($dblog->variables);
      if (!isset($vars) || ($vars === FALSE && $value !== $serialized_false)) {
        $message = strip_tags(decode_entities($dblog->message));
      }
      else {
        $message = strip_tags(decode_entities(t($dblog->message, $vars)));
      }

      $row = array(
        format_date($dblog->timestamp, 'short'),
        $dblog->type,
        $message,
        $dblog->name,
      );

      $rows[] = implode(' : ', $row);

    }

    return array('watchdog' => $rows);
  }

  private function getSession() {
    $session  = array();
    $serialized_false = serialize(FALSE);
    foreach ($_SESSION as $key => $value) {
      @$unserialized = unserialize(is_string($value) ? $value : $serialized_false);
      if ($unserialized === FALSE && $value !== $serialized_false) {
        $session[$key] = $value;
      }
      else {
        $session[$key] = $unserialized;
      }
    }
    return $session;
  }

  private function convertArrayToObject($array) {
    $object = new stdClass();
    foreach ($array as $key => $value) {
      $object->key = $value;
    }
    return $object;
  }

}
