$(document).ready(function(){
    var checkboxes = $("input[name='selected_content']")

    $('.js-selectContent').click(function(event) {  
      var selected_content = $("input[name='selected_content']:checked").val()
      var selected_content_data = JSON.parse(selected_content)
      var selected_content_contentType = selected_content_data[0]
      var selected_content_contentPackage = selected_content_data[1]
      var selected_content_name = selected_content_data[2]
      $("input[name='selected_content']").val(selected_content_name)
      var content_url_base = $("input[name='content_url_base']").val()
      var content_url = content_url_base + "/" + selected_content_contentType + "/" + selected_content_contentPackage
      $("input[name='content_url_base']").val(content_url)
      $('#assignment_selection').submit()
    }).attr('disabled', !checkboxes.is(":checked"))

    checkboxes.click(function() {
        $('.js-selectContent').attr("disabled", !checkboxes.is(":checked"));
    });

    $('.js-showContent-selection').click(function(event) {  
        event.preventDefault();
        var allContent = $(this).parent().find('.allContent');
        var teaserContent = $(this).parent().find('.teaserContent');
        allContent.toggle();
        teaserContent.toggle();
        if(allContent.is(':visible')) {
          $(this).text('Hide');
          $(this).parent().append($(this));
        } else {
          $(this).text('Show All');
          $(this).parent().find('.teaserContent').after($(this));
        }
      })  

});