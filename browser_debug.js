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

    printDebug(Drupal.settings.browserDebug);

  });

  function printDebug(data) {    
    console.log('Session:');
    console.log(data.session);
    
    if(data.log.length > 0) {
      console.log('Log:');
      for(var i = 0; i < data.log.length; i++) {
        console.log(data.log[i]);
      }      
    }

    if(data.watchdog.length > 0) {
      console.log('Watchdog:');
      for(var i = 0; i < data.watchdog.length; i++) {
        console.log(data.watchdog[i].join(' : '));
      }      
    }

  }


})(jQuery);

