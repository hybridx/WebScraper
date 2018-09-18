$(document).ready(function () {
	$('form').on('submit',function(event){
		
		$.ajax({
			url: '/process',
			type: 'POST',
			data: $('#search').val(),
		})
		.done(function(data) {
			console.log("search complete " + data);
		})
		.fail(function() {
			console.log("error");
		});
		

		event.preventDefault();


	});
});