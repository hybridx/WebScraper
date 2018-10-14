$(document).ready(function() {
	//This is where the data is sent
	$('#searchForm').on('submit',function (event) {
		$.ajax({
			url: '/searchAJAX',
			type: 'GET',
			data: $('#search'),
		})
		//this is where the response is received
		.done(function(data) {
			//console.log("success " + data);
			var displayData;
			displayData = '';
			displayData += '<thead class="thead-dark"><tr><th>#</th><th>Name</th><th>Link</th></tr></thead>';
			$.each(JSON.parse(data),function(key,value) {
				displayData += '<tbody id="tableBody">';
				displayData += '<tr>';
				displayData += '<th scope="row">'+value.id+'</th>';
				displayData += '<td>'+value.name+'</td>';
				displayData += '<td class="d-inline-block col-8"><a class="text-muted" href='+value.link+'>'+value.link+'</a></td>';
				displayData += '</tr>';
				displayData += '</tbody>';
			});
			if (data.length > 17)
				$('#searchResponse').html(displayData);
			else
				$('#searchResponse').html('<p class="text-danger" id="noItemsFound">No items found</p>')

		});		
		event.preventDefault();
	});

//--------------------------------------------------------------------------------------


	$('#addLinkForm').on('submit',function(event){

		$(document).ajaxStart(function(){
			//console.log("loading");
        	$('#loading').attr('style', 'visibility: visible;');
        	$('#addLinkBtn').attr('class', 'btn btn-outline-danger disabled');
    	});
    	$(document).ajaxComplete(function(){
    		//console.log("loading complete");
        	$('#loading').attr('style', 'visibility: hidden;');
        	$('#addLinkBtn').attr('class','btn btn-outline-success');
    	});
		$.ajax({
			url: '/adminAJAX',
			type: 'POST',
			data: $('#addLink'),
		})
		.done(function(data) {
			console.log("success " + data);
			var test = $.parseJSON(data);
			console.log(test[0]["status"],test[0]["response"]);
			$('#LinkResponse').text("This is the status "+ test[0]["status"] + " with link = " + test[0]["response"])
		});

		event.preventDefault();
	});

//-----------------------------------------------------------------------------------------
	
});