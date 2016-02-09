$(document).ready(function() {
    $("#panelContainer .resizer").mousedown(function(e){
        e.stopPropagation();
        var h = $("#panelContainer").height(),
            minLimit = parseInt($("#panelContainer").css("min-height")),
            maxLimit = $(window).height() / 100 * 60,
            oldY = e.pageY;
            
            
        $(".container.main").css("cursor", "n-resize").css("-webkit-user-select", "none");
  
        $(window).mousemove(function( event ) {
            event.stopPropagation();
            var newH = h + oldY - event.pageY;
            
            newH = (newH > maxLimit) ? maxLimit : newH;    
            newH = (newH < minLimit) ? minLimit : newH;
            
            $("#panelContainer").height(newH);
        });
        $(window).mouseup(function(){
            $(window).unbind("mousemove");
            $(".container.main").css("cursor", "default").css("-webkit-user-select", "inherit");
        });   
    });
    
    //class for registration
    $(".cClass").click(function(e) {
        var $el = $(e.target).parents(".cClass"), cls;
        $(".cClass").removeClass("selected");
        cls = $el.attr("tag");
        $el.addClass("selected");
        $("#formRegLogin").val(cls);
        $("#formSelectChar").val(cls);
        $("#select-char-btn").prop("disabled",false);
    })
    
    $('.skill_panel .skill_tab a').click(function (e) {
        e.preventDefault()
        $(this).tab('show')
    })
})