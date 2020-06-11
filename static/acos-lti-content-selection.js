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

});