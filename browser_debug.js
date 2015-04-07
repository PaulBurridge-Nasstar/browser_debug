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
        printDebug(response.arguments);
      };      
    }

    var data = Drupal.settings.browserDebug;

    $('body').append(Drupal.settings.browserDebug.html);
    var $browser_debug = $('#browser_debug');
    var $browser_debug_toolbar = $('#browser_debug_toolbar');
    
    // Move dumps.
    var $dump = $('#browser_debug_panel_dump');
    $('.sf-dump').appendTo($dump).show();

    // Create debug panels for logs.
    var $panel = $('#browser_debug_panel');
    var $button = $('#browser_debug_button');
    $.each(data.logs, function (logName, logData) {
      var safeLogName = logName.replace(/\W/g, '_');
      // Panel.
      var $newPanel = $panel.clone();
      $newPanel.attr('id', $panel.attr('id') + '_' + safeLogName);
      $browser_debug.prepend($newPanel);
      // Panel contents.
      $.each(logData, function(index, text) {
        $newPanel.append($('<pre></pre>').text(text));
      });
      // Button.
      var $newButton = $button.clone();
      $newButton.attr('id', $button.attr('id') + '_' + safeLogName).text(logName);
      $browser_debug_toolbar.append($newButton);
    });
    $panel.remove();
    $button.remove();
    
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
        $element.addClass('browser-debug-panel-visible').css('top', '-' + ($element.outerHeight() + 42)  + 'px').focus();
      }
    });
    // printDebug(Drupal.settings.browserDebug);
  });

  function printDebug(data) {    
    console.log('Session:');
    console.log(data.session);

    $.each(data.logs, function(log, value) {
      var o = {};
      o[log] = value;
      console.log(o);
    });

    if(data.log.length > 0) {
      console.log('Log:');
      for(var i = 0; i < data.log.length; i++) {
        console.log(data.log[i]);
      }      
    }
  }

})(jQuery);

