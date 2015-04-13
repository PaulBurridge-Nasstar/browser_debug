<?php
/**
 * @file
 * Browser Debug Class.
 *
 * @todo
 * Cater for truncated watchdog table.
 */

use Symfony\Component\VarDumper\Cloner\VarCloner;
use Symfony\Component\VarDumper\Dumper\HtmlDumper;

/**
 * Browser Debug Class.
 */
class BrowserDebug {

  private $settings;
  private $stream;
  private $cloner;
  private $dumper;

  /**
   * Object constructor.
   */
  public function __construct() {
    $this->stream = fopen('php://memory', 'r+');
    $this->cloner = new VarCloner();
    $this->dumper = new HtmlDumper($this->stream);
    $this->getSettings();
    $this->updateLogPositions();
  }

  /**
   * Update log positions.
   */
  private function updateLogPositions() {
    if ($this->settings['watchdog'] === 0) {
      $this->settings['watchdog'] = $this->getWatchdogPosition();
    }
    foreach ($this->settings['logs'] as $log => &$pos) {
      $size = (int) filesize($log);
      if ($pos === 0) {
        // No position in settings so start from current position.
        $pos = $size;
      }
      elseif ($pos > $size) {
        // File may have been recreated or rotated.
        $pos = 0;
      }
    }
  }

  /**
   * Dump variable.
   *
   * @param mixed $var
   *   Variable to dump.
   * @param string $label
   *   Optional label.
   */
  public function dump($var, $label = '') {
    if (!empty($label)) {
      $var = array($label => $var);
    }
    $this->dumper->dump($this->cloner->cloneVar($var));
  }

  /**
   * Get dump from stream.
   *
   * @return string
   *   HTML created by dumper.
   */
  private function getDump() {
    rewind($this->stream);
    $s = stream_get_contents($this->stream);
    return $s;
  }

  /**
   * Get settings from Drupal variable and update as necessary.
   */
  private function getSettings() {
    $logs = variable_get('browser_debug_logs', '');
    if (empty($logs)) {
      $logs = array();
    }
    else {
      $logs = explode(',', $logs);
      $logs = array_combine($logs, array_pad(array(), count($logs), 0));
    }
    // Make array of with log path as key and 0 as value;
    $settings = variable_get('browser_debug_settings', array());
    // Create default array structure.
    $default = array('watchdog' => 0, 'logs' => $logs);
    // Add missing.
    $settings = array_replace_recursive($default, $settings);
    // Remove extra.
    $settings['logs'] = array_intersect_key($settings['logs'], $logs);
    // $this->log(print_r($settings, TRUE), 'settings (get)');
    $this->settings = $settings;
  }

  /**
   * Save settings to Drupal variable.
   */
  private function saveSettings() {
    // $this->log(print_r($this->settings, TRUE), 'settings (set)');
    variable_set('browser_debug_settings', $this->settings);
  }

  /**
   * Get all data.
   *
   * @return array
   *   Array containg all data gathered.
   */
  public function getAllData() {
    $this->dump(array(
      'session' => $this->getSession(),
      'cookie' => $_COOKIE,
      'server' => $_SERVER,
      'request' => $_REQUEST,
    ));
    $data = array(
      'logs' => array_merge($this->getWatchdogLog(), $this->getLogs()),
      'html' => file_get_contents(drupal_get_path('module', 'browser_debug') . '/browser_debug.html'),
    );
    $this->saveSettings();
    // Add log, done as last step to enable internal logging until the last
    // moment.
    $data['dump'] = $this->getDump();
    return $data;
  }

  /**
   * Get Watchdog log position.
   *
   * @return int
   *   The last watchdog log id.
   */
  public function getWatchdogPosition() {
    $wid = (int) db_query('select max(wid) from watchdog;')->fetchField();
    return $wid;
  }

  /**
   * Get Watchdog log.
   *
   * @return array
   *   Formated Watchdog log entries.
   */
  private function getWatchdogLog() {
    $wid = $this->getWatchdogPosition();
    $last_wid = $this->settings['watchdog'];
    $this->settings['watchdog'] = $wid;

    $query = db_select('watchdog', 'w')->extend('PagerDefault')->extend('TableSort');
    $query->leftJoin('users', 'u', 'w.uid = u.uid');
    $query
      ->fields('w', array(
       'wid',
       'uid',
       'severity',
       'type',
       'timestamp',
       'message',
       'variables',
       'link'))
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
        date('Y-m-d H:i:s', $dblog->timestamp),
        $dblog->type,
        $message,
        $dblog->name,
      );

      $rows[] = implode(' : ', $row);

    }
    return array('watchdog' => $rows);
  }

  /**
   * Get session.
   *
   * @return array
   *   Formatted session object with any serialized data serialized.
   */
  private function getSession() {
    if (!isset($_SESSION)) {
      return array();
    }
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

  /**
   * Get Logs.
   *
   * @return array
   *   Array containing all log file entries.
   */
  private function getLogs() {
    $return = array();
    foreach ($this->settings['logs'] as $log => &$pos) {
      if (!file_exists($log)) {
        $this->log('The file ' . $log . ' does not exist', 'Error');
        $return[basename($log)] = array();
        continue;
      }
      $new_pos = filesize($log);
      if ($new_pos <= $pos) {
        $return[basename($log)] = array();
        continue;
      }
      $contents = file_get_contents($log, FALSE, NULL, $pos, $new_pos - $pos);
      $array = explode("\n", $contents);
      array_pop($array);
      $return[basename($log)] = $array;
      $pos = $new_pos;
    }
    return $return;
  }

}
