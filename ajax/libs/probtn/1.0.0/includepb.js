if (!window.jQuery) {
    console.log("No jquery");
    document.write("<script src=\"http://code.jquery.com/jquery-1.9.1.js\"><\/script>");
} else {
    console.log("is jquery");
}
document.write(
    "<script>("
    + "function ($) {"
        + "$.noConflict();"
        + "jQuery(document).ready(function() {"
        + "jQuery.getScript('https://pizzabtn.herokuapp.com/javascripts/jquery.pep.min.js', function() {"
            + "jQuery.getScript('https://pizzabtn.herokuapp.com/javascripts/jquery.fancybox.js', function () {"
                + "jQuery.getScript('https://pizzabtn.herokuapp.com/javascripts/probtn.js', function () {"
                    + "jQuery(document).ready(function($){$(document).StartButton({'mainStyleCss':'https://pizzabtn.herokuapp.com/stylesheets/probtn.css'});});"
                + "})"
            + "});"
        + "});"
    + "});"
    + "})(window.jQuery);"
    + "<\/script>"
);

