if (typeof console === "undefined") {
  console = {};
  console.log = function() {
    return;
  };
}

(function($) { // Wrapper for Drupal 7 - http://drupal.org/node/1003664

  $(document).ready(function () {

    if(Drupal.ajax) {
      Drupal.ajax.prototype.commands.browserDebugAjaxComplete =  function(ajax, response, status) {
        console.log('browserDebugAjaxComplete');
      };      
    }

    var data = Drupal.settings.browserDebug;

    // Add browser debug html to body.
    $('body').append(Drupal.settings.browserDebug.html);
    var $browser_debug = $('#browser_debug');
    var $browser_debug_toolbar = $('#browser_debug_toolbar');
    var $browser_debug_panel = $('#browser_debug_panel');
    var $browser_debug_button = $('#browser_debug_button');
    
    // Populate dumps.
    var $dump = $('#browser_debug_panel_dump').html(Drupal.settings.browserDebug.dump);
    
    // Create panels and buttons for logs and populate panels.
    $.each(data.logs, function (logName, logData) {
      var safeLogName = logName.replace(/\W/g, '_');
      // Panel.
      var $newPanel = $browser_debug_panel.clone();
      $newPanel.attr('id', $browser_debug_panel.attr('id') + '_' + safeLogName);
      $browser_debug.prepend($newPanel);
      // Panel contents.
      $.each(logData, function(index, text) {
        $newPanel.append($('<pre></pre>').text(text));
      });
      // Button.
      var $newButton = $browser_debug_button.clone();
      $newButton.attr('id', $browser_debug_button.attr('id') + '_' + safeLogName).text(logName);
      $browser_debug_toolbar.append($newButton);
    });
    $browser_debug_panel.remove();
    $browser_debug_button.remove();
    var toolbarHeight = $browser_debug_toolbar.outerHeight();
    
    // Add defaults and tab index's (required for focus).
    var panelMaxHeight = Math.floor($(window).height() - 80);
    $browser_debug.find('.browser-debug-panel').attr('tabindex', 1).css('max-height', panelMaxHeight + 'px').css('top', '0');

    // Wire up buttons.
    $('#browser_debug_toolbar a').click(function() {
      var $element = $('#browser_debug_panel_' + this.id.substr(21));
      var wasVisible = $element.hasClass('browser-debug-panel-visible');
      // Hide all.
      $browser_debug.find('.browser-debug-panel-visible').removeClass('browser-debug-panel-visible').css('top', '0');
      if(!wasVisible) {
        // Show panel.
        $element.addClass('browser-debug-panel-visible').css('top', '-' + ($element.outerHeight() + toolbarHeight)  + 'px').focus();
      }
    });

    // Wire up dump toggling.
    $dump.find('.sf-dump-toggle').click(function() {
      setTimeout(function() { 
        $dump.css('top', '-' + ($dump.outerHeight() + toolbarHeight)  + 'px');
      }, 0);
    });

    // Check for mouse clicks outside of browser debug area.
    $(document).mouseup(function (e) {
      // if the target of the click isn't the container nor a descendant of the container.
      if (!$browser_debug.is(e.target) && $browser_debug.has(e.target).length === 0) { 
        $browser_debug.find('.browser-debug-panel-visible').removeClass('browser-debug-panel-visible').css('top', '0');
      }
    });

  });

})(jQuery);

