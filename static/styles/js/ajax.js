$(document).ready(function() {
	//This is where the data is sent
	$('#searchForm').on('submit',function (event) {
		$.ajax({
			url: '/searchAJAX',
			type: 'POST',
			data: $('#search'),
		})
		//this is where the response is received
		.done(function(data) {
			//console.log("success " + data);
			var displayData;
			displayData = '';
			displayData += '<thead class="thead-dark"><tr><th>#id</th><th>Name</th><th>Link</th></tr></thead>';
			$.each(JSON.parse(data),function(key,value) {
				displayData += '<tbody id="tableBody">';
				displayData += '<tr>';
				displayData += '<th scope="row">'+value.id+'</th>';
				displayData += '<td>'+value.name+'</td>';
				displayData += '<td><a class="text-warning" href='+value.link+'>'+value.link+'</a></td>';
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

		$.ajax({
			url: '/adminAJAX',
			type: 'POST',
			data: $('#addLink'),
		})
		.done(function(data) {
			console.log("success " + data);
			var displayData;
			displayData = '';
			displayData += '<thead class="thead-dark"><tr><th>#id</th><th>Name</th><th>Link</th></tr></thead>';
			$.each(JSON.parse(data),function(key,value) {
				displayData += '<tbody id="tableBody">';
				displayData += '<tr>';
				displayData += '<th scope="row">'+value.id+'</th>';
				displayData += '<td>'+value.name+'</td>';
				displayData += '<td>'+value.link+'</td>';
				displayData += '</tr>';
				displayData += '</tbody>';
			});
			$('#addedLinks').html(displayData);
		});

		event.preventDefault();
	});
	
});