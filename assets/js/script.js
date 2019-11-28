/* 
* Scroll to the top
*/

$(window).bind("scroll",display);
function display () {
    if($(document).scrollTop()>300) {
        //$("#top").show();
		$("#top").fadeIn(300);
    }else {
        //$("#top").hide();
		$("#top").fadeOut(300);
    }
}

/* 
* Tab of posts
*/
$(document).ready(function () {
	var tabContainer = $(".posts-tabs");
	if (tabContainer.length) {
		for ( let i = $(".posts-tab-item").length -1; i >= 0 ; --i )
		{
			$($(".posts-tab-item")[i]).click(function () {
				showTab(i);
			});
		}
	}

	function showTab (en_item) {
		console.log($(".posts-tab-item").length);
		for ( let i=0; i < $(".posts-tab-item").length; ++i)
		{
			$($(".posts-tab-item")[i]).removeClass("active");
			$($(".posts-list")[i]).addClass("tab-hidden");
			$($(".page-holder")[i]).addClass("tab-hidden");
		}
		$($(".posts-tab-item")[en_item]).addClass("active");
		$($(".posts-list")[en_item]).removeClass("tab-hidden");
		$($(".page-holder")[en_item]).removeClass("tab-hidden");
		
	}
})

/*
 * Pagination
 */
$(function(){
  /* initiate the plugin */
  $("div.page-holder-one").jPages({
      containerID  : "pag-itemContainer-one",
      previous: "«",
      next: "»",
      perPage      : 5,  /* num of items per page */
      startPage    : 1,
      startRange   : 1,
      midRange     : 4,
      endRange     : 1,
      direction    : "auto"
  });
  $("div.page-holder-two").jPages({
      containerID  : "pag-itemContainer-two",
      previous: "«",
      next: "»",
      perPage      : 5,  /* num of items per page */
      startPage    : 1,
      startRange   : 1,
      midRange     : 4,
      endRange     : 1,
      direction    : "auto"
  });
  console.log($("div.page-holder-one"));
  for ( var i = 2; i < $("div.page-holder").length; ++i )
  {
    $($("div.page-holder")[i]).jPages({
        containerID  : "pag-itemContainer-"+i,
        previous: "«",
        next: "»",
        perPage      : 5,  /* num of items per page */
        startPage    : 1,
        startRange   : 1,
        midRange     : 4,
        endRange     : 1,
        direction    : "auto"
    });
  }
});
