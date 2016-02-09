$(document).ready(function() {
    var dropEvent = function(event, ui) {
        var _this = $(this),
            _attr = ui.draggable.data( 'img' ),
            _attr2 = ui.draggable.data( 'skillid' ),
            slot = _this.attr('slotid'),
            addbutton = _this.children('a');
        panel_state(_attr2,slot);
       // _this.droppable( 'disable' );
        addbutton.addClass("fight-button").attr("skillid",_attr2);
        _this.find("img").attr("src", _attr);

    }
    
    $('.skill_panel li.skill_tabs a').click(function (e) {
        e.preventDefault();
       // $(this).tab('show');
        var _this = $(this),
             id = _this.attr("tag");
             
        _this.parents(".skill_panel").find("li").removeClass("active");
        _this.parent().addClass("active");
        _this.tab('show');
        
        if (id) {
            $(".skill_content .tab-pane").removeClass("active").addClass("fade");
            $(".skill_content #" + id).addClass("active").removeClass("fade");
        }
    })
          for ( var i=1; i<=10; i++ ) {
        $('<div class="col-xs-1"><a class="thumbnail" href="#"><img src="/img/skill_empty.png" class="img-responsive"></a></div>')
            .attr( 'slotid', i ).appendTo( '.skill_slots' ).droppable( {
                accept: '.skill_cards div',
                hoverClass: 'hovered',
                drop: dropEvent
            });
    }
    $('<div id="openskill_panel" class="col-xs-1"><a class="thumbnail" href="#"><i class="fa fa-plus"></i></a></div>')
        .data('number',11).appendTo('.skill_slots')
    $('.skill_panel').hide();
    $('.skill_content').hide();
})    

$(document).on('click', '#openskill_panel', function() {
    $('.skill_panel').toggle();
    $('.skill_content').toggle();

})

function panel_state (skillid,slotid) {
    
}