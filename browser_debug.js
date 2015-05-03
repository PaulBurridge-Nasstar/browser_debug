if (typeof console === "undefined") {
  console = {};
  console.log = function() {
    return;
  };
}

(function($) { // Wrapper for Drupal 7 - http://drupal.org/node/1003664

  $(document).ready(function () {

    if(Drupal.ajax) {
      Drupal.ajax.prototype.commands.browserDebugAjaxComplete = function(ajax, response, status) {
        // console.log('browserDebugAjaxComplete');
        getData();
      };      
    }

    initialise();

    var $browser_debug;
    var $browser_debug_toolbar;
    var toolbarHeight;

    function initialise() {
      // Add browser debug html to body.
      $('body').append(Drupal.settings.browserDebug.html);
      $browser_debug = $('#browser_debug');
      $browser_debug_toolbar = $('#browser_debug_toolbar');
      
      createLogPanels(Drupal.settings.browserDebug.logs);

      wireUp();

      toolbarHeight = $browser_debug_toolbar.outerHeight();
      
      // Add defaults and tab index's (required for focus).
      var panelMaxHeight = Math.floor($(window).height() - 40 - toolbarHeight);
      $browser_debug.find('.browser-debug-panel').attr('tabindex', 1).css('max-height', panelMaxHeight + 'px').css('top', '0');      
      // Ajax call for data.
      getData();
    }

    function createLogPanels(logs) {
      var $browser_debug_panel = $('#browser_debug_panel');
      var $browser_debug_button = $('#browser_debug_button');
      // Create panels and buttons for logs and populate panels.
      $.each(logs, function (logName, logPosition) {
        // Get filename
        logName = logName.split('/').pop();
        var safeLogName = logName.replace(/\W/g, '_');
        // Panel.
        var $panel = $('#browser_debug_panel_' + safeLogName);
        // Create panel
        $panel = $browser_debug_panel.clone();
        $panel.attr('id', 'browser_debug_panel_' + safeLogName);
        $browser_debug.prepend($panel);
        // Create Button.
        if($('#browser_debug_button_' + safeLogName).length === 0) {
          var $button = $browser_debug_button.clone();
          $button.attr('id', 'browser_debug_button_' + safeLogName).text(logName);
          $browser_debug_toolbar.append($button);
        }
      });
      $browser_debug_panel.remove();
      $browser_debug_button.remove();
    }

    function populateDumps(dump) {
      var $dump = $('#browser_debug_panel_dump').append(dump);
      // Wire up dump toggling.
      $dump.find('.sf-dump-toggle').click(function() {
        setTimeout(function() { 
          var top = -($dump.innerHeight() + toolbarHeight);
          if(top < $dump.position().top) {
            $dump.css('top', top  + 'px');
          }
        }, 0);
      });
    }

    function populateLogs(logs) {
      // Populate log panels.
      $.each(logs, function (logName, logData) {
        var safeLogName = logName.replace(/\W/g, '_');
        // Panel.
        var $panel = $('#browser_debug_panel_' + safeLogName);
        // Panel contents.
        $.each(logData, function(index, text) {
          var $pre = $('<pre></pre>').text(text);
          $pre.html($pre.html().replace(/ /g, "&nbsp;"));
          $panel.append($pre);
        });
      });
    }
 
    function wireUp() {
      // Wire up buttons.
      $('#browser_debug_toolbar a').click(buttonClick);        
      // Check for mouse clicks outside of browser debug area.
      $(document).mouseup(documentMouseUp);
    }

    function buttonClick() {
      var $element = $('#browser_debug_panel_' + this.id.substr(21));
      var wasVisible = $element.hasClass('browser-debug-panel-visible');
      // Hide all.
      $browser_debug.find('.browser-debug-panel-visible').removeClass('browser-debug-panel-visible').css('top', '0');
      if(!wasVisible) {
        // Show panel.
        $element.addClass('browser-debug-panel-visible').css('top', '-' + ($element.innerHeight() + toolbarHeight)  + 'px').focus();
      }
      return false;
    }

    function documentMouseUp(e) {
      // if the target of the click isn't the container nor a descendant of the container.
      if (!$browser_debug.is(e.target) && $browser_debug.has(e.target).length === 0) {
        // Close open panel.
        $browser_debug.find('.browser-debug-panel-visible').removeClass('browser-debug-panel-visible').css('top', '0');
      }
    }

    function getData() {
      $.getJSON( "browser-debug/json", function(data) {
        // console.log('data');
        // console.log(data);
        populateDumps(data.dump);
        populateLogs(data.logs);
      });
    }

  });

})(jQuery);

