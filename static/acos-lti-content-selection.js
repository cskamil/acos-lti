$(document).ready(function(){
    var checkboxes = $("input[name='selected_content']")

    $('.js-selectContent').click(function(event) {  
        var selected_content_name = $("input[name='selected_content']:checked").val()
        $("input[name='selected_content']").val(selected_content_name)
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