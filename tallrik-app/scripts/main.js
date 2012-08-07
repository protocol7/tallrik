
var sp = getSpotifyApi(1);

var templates = {
  "layout": null,
};


exports.init = function () {
  
  sp.require("scripts/jquery-1.7.2.min");
  sp.require("scripts/jquery-ui-1.8.21.custom.min");
  sp.require("scripts/less-1.3.0.min");
  var slab = sp.require("scripts/slab").slab;
  
  $(function() {
  
    var t = templates;
    templates = {};
    var defs = $.map(t, function(_, k) { return $.get("templates/" + k + ".slab", function(data) { templates[k] = slab.compile(data); }) });
    $.when.apply($, defs).done(function() {
      var layout = $(templates["layout"].main());
      $("body").append(layout);
    });
    
  });
}