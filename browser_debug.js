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

