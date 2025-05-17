const labels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
let labelIndex = 0;
let map;
const contentString = 'ssas';
let activeInfoWindow = null;
let stationsData = null;
let markers = [];
let polyline = null;

function initMap() {
	var location = { lat: 12.021508, lng: 75.2596 };
	map = new google.maps.Map(document.getElementById("map"), {
		zoom: 12,
		center: location
	});
	// Map Click Event - Add Marker on Click
	map.addListener("click", function(event) {
		console.log(event.latLng);
	});

	// Zoom Changed Event
	map.addListener("zoom_changed", function() {
		console.log("Zoom Level:", map.getZoom());
	});

	// Drag Event - When the map is moved
	map.addListener("dragend", function() {
		console.log("Map dragend");
	});
	
	const ts_trains = document.getElementById("ts-trains");
	ts_trains.addEventListener("input", function() {
		var trainNumber = ts_trains.value.substring(0, ts_trains.value.indexOf("-")).trim();
		fetchStations(trainNumber);
	});
	
	const rc_trains = document.getElementById("rc-trains");
	rc_trains.addEventListener("input", function() {
		var trainNumber = rc_trains.value.substring(0, rc_trains.value.indexOf("-")).trim();
		populateStations(trainNumber);
	});	

	const ts_fromStation = document.getElementById("ts-fromStation");
	ts_fromStation.addEventListener('input', function () {
		const selectedValue = ts_fromStation.value;
		ts_fromStation.value = selectedValue.substring(selectedValue.indexOf("-")+1).trim();
	});

	const ts_toStation = document.getElementById("ts-toStation");
	ts_toStation.addEventListener('input', function () {
		const selectedValue = ts_toStation.value;
		ts_toStation.value = selectedValue.substring(selectedValue.indexOf("-")+1).trim();
	});

	const rc_fromStation = document.getElementById("rc-fromStation");
	rc_fromStation.addEventListener('input', function () {
		const selectedValue = rc_fromStation.value;
		rc_fromStation.value = selectedValue.substring(selectedValue.indexOf("-")+1).trim();
	});

	const rc_toStation = document.getElementById("rc-toStation");
	rc_toStation.addEventListener('input', function () {
		const selectedValue = rc_toStation.value;
		rc_toStation.value = selectedValue.substring(selectedValue.indexOf("-")+1).trim();
	});

	document.getElementById("rc-chartBtn").addEventListener('click', function () {
		loadTrainComposition();
	});

	loadStationsData();
	fetchTrains();
}

function loadStationsData() {
	fetch('stations.json')
		.then(response => response.json())
		.then(stations => {
			stationsData = stations;
			/*var count = 100;
			var minLat = 9999, maxLat = 0;
			var minLog = 9999, maxLog = 0;
			let bounds = new google.maps.LatLngBounds();

			for (let i = 0; i < stations.length; i++) {
				try {
					var station = stations[i];
					if(station.trainCount > 50 && station.latitude != '' && station.longitude != '')
					{
						if(count == 0)
							break;
						count--;

						addMarker(station, bounds);

						if(station.latitude < minLat)
							minLat = station.latitude;
						if(station.latitude > maxLat)
							maxLat = station.latitude;
						
						if(station.longitude < minLog)
							minLog = station.longitude;
						if(station.longitude > maxLog)
							maxLog = station.longitude;
					}
				}
				catch(e)
				{
					alert('Exception: '+ e);
				}
			}*/
			//var location = { lat: (minLat + maxLat)/2, lng: (minLog + maxLog)/2 };
			//map.setCenter(location);
			/*stations.forEach(station => {
				addMarker(station);
			});*/
			//map.fitBounds(bounds);
		}).catch(error => console.error("Error loading JSON:", error));
}

function addMarker(station, bounds) {
	var location = { lat: station.latitude, lng: station.longitude };
	var marker = new google.maps.Marker({
		position: location,
		map: map,
		title: station.name,
		//label: station.code[0],
		icon: "location.png"
	});

	let infoWindowContent = `
                <div>
                    <h3>${station.name} (${station.code})</h3>
                    <p><strong>Name (Hindi):</strong> ${station.name_hi}</p>
                    <p><strong>District:</strong> ${station.district}</p>
                    <p><strong>State:</strong> ${station.state}</p>
                    <p><strong>Train Count:</strong> ${station.trainCount}</p>
                    <p><strong>Address:</strong> ${station.address}</p>
					<p><strong>Latitude:</strong> ${station.latitude}</p>
					<p><strong>Longitude:</strong> ${station.longitude}</p>
                </div>`;
	const infowindow = new google.maps.InfoWindow({
		content: infoWindowContent,
		ariaLabel: station.name
	});
	
	marker.addListener("click", () => {
		if (activeInfoWindow && activeInfoWindow.isOpen) {
			activeInfoWindow.close();
		}
		infowindow.open({
			anchor: marker,
			map,
		});
		activeInfoWindow = infowindow;
	});
	markers.push(marker);
	bounds.extend(location);
	//map.setCenter(location);
}

// Function to fetch station data
async function fetchTrains() {
	try {
		const apiUrl = 'https://www.irctc.co.in/eticketing/trainList';
		let response = await fetch(apiUrl);  // Fetch data from API
		let textData = await response.text(); // Read as plain text
		let trainNames = textData
						.split(",")
						.map(s => s.trim())
						.map(s => s.replace(/"/g, ''));

		// Get the trainsList element
		const ts_trainsList = document.getElementById("ts-trainsList");
		const rc_trainsList = document.getElementById("rc-trainsList");
		
		ts_trainsList.innerHTML = '';
		rc_trainsList.innerHTML = '';
		
		// Populate the trainsList dynamically
		trainNames.forEach(train => {
			let option = document.createElement("option");
			option.value = train;
			ts_trainsList.appendChild(option);

			option = document.createElement("option");
			option.value = train;
			rc_trainsList.appendChild(option);
		});
	} catch (error) {
		console.error("Error fetching train data:", error);
	}
}

async function populateStations(trainNumber) {
	try {
		if(isNaN(trainNumber) || trainNumber == null || trainNumber == '') return;
		const apiUrl = 'https://www.irctc.co.in/eticketing/protected/mapps1/trnscheduleenquiry/' + trainNumber;
		//let response = await fetch(apiUrl);
		let response = await fetch(apiUrl, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "greq": "0"
                }
            });
		let data = await response.json();
		const rc_fromStationsList = document.getElementById("rc-fromStationsList");
		const rc_toStationsList = document.getElementById("rc-toStationsList");
		rc_fromStationsList.innerHTML = '';
		rc_toStationsList.innerHTML = '';

		if(data.stationList != null) {
			for (let i = 0; i < data.stationList.length; i++) {
				let station = data.stationList[i];

				let option = document.createElement("option");
				option.value = station.stnSerialNumber + ' - ' + station.stationName + ' (' + station.stationCode + ')';
				rc_fromStationsList.appendChild(option);

				option = document.createElement("option");
				option.value = station.stnSerialNumber + ' - ' + station.stationName + ' (' + station.stationCode + ')';
				rc_toStationsList.appendChild(option);
			}
		}
		else if(data.error != null)
		{
			showSnackbar(data.error);
		}
	} catch (error) {
		console.error("Error fetching stationList:", error);
	}
}
async function fetchStations(trainNumber) {
	try {
		clearMarkers();
		if(isNaN(trainNumber) || trainNumber == null || trainNumber == '') return;
		const apiUrl = 'https://www.redbus.in/railways/api/getLtsDetails?trainNo=' + trainNumber;
		let response = await fetch(apiUrl);
		let data = await response.json();
		let bounds = new google.maps.LatLngBounds();
		const pathCoordinates = [];
		const stationData = [];
		const ts_fromStationsList = document.getElementById("ts-fromStationsList");
		const ts_toStationsList = document.getElementById("ts-toStationsList");

		ts_fromStationsList.innerHTML = '';
		ts_toStationsList.innerHTML = '';

		if(data.stations != null) {
			for (let i = 0; i < data.stations.length; i++) {
				let station = data.stations[i];

				stationData.push(station);
				//let option = document.createElement("option");
				//option.value = station.stnSerialNumber + ' - ' + station.stationName + ' (' + station.stationCode + ')';
				//ts_fromStationsList.appendChild(option);
				
				//option = document.createElement("option");
				//option.value = station.stnSerialNumber + ' - ' + station.stationName + ' (' + station.stationCode + ')';
				//ts_toStationsList.appendChild(option);

				let selectedStation = stationsData.find(stn => stn.code === station.stationCode);
				if (selectedStation) {
					if(selectedStation.latitude == null)
						continue;
					else if(selectedStation.longitude == null)
						continue;
					else if(selectedStation.latitude == 0)
						continue;
					else if(selectedStation.longitude == 0)
						continue;
					else if(selectedStation.latitude == '')
						continue;
					else if(selectedStation.longitude == '')
						continue;

					addMarker(selectedStation, bounds);

					var location = { lat: selectedStation.latitude, lng: selectedStation.longitude };
					pathCoordinates.push(location);
				}
				if(station.intermediateStations)
				{
					for (let j = 0; j < station.intermediateStations.length; j++) {
						try {
							if(i == 41 && j == 9)
							{
								alert('stop');
							}
							let intermediateStation = station.intermediateStations[j];

							let selectedStation = stationsData.find(stn => stn.code === intermediateStation.stationCode);
							if (selectedStation) {
								if(selectedStation.latitude == null)
									continue;
								else if(selectedStation.longitude == null)
									continue;
								else if(selectedStation.latitude == 0)
									continue;
								else if(selectedStation.longitude == 0)
									continue;
								else if(selectedStation.latitude == '')
									continue;
								else if(selectedStation.longitude == '')
									continue;

								//addMarker(selectedStation, bounds);

								var location = { lat: selectedStation.latitude, lng: selectedStation.longitude };
								pathCoordinates.push(location);
							}
						}catch (error) {
							console.error("Error fetching stationList:", error);
						}
					}
				}
			}
			//populateTable(stationData);
			polyline = new google.maps.Polyline({
				path: pathCoordinates, // The path of the line
				geodesic: true, // Smooth curve on earth's surface
				strokeColor: "#FF0000", // Red color
				strokeOpacity: 1.0, // Full opacity
				strokeWeight: 3 // Line thickness
			});

			polyline.setMap(map); // Add the line to the map
			//map.fitBounds(bounds);
			animateFitBounds(map, bounds);
		}
	} catch (error) {
		console.error("Error fetching stationList:", error);
	}
}

async function fetchStations_Dep(trainNumber) {
	try {
		clearMarkers();
		if(isNaN(trainNumber) || trainNumber == null || trainNumber == '') return;
		const apiUrl = 'https://www.irctc.co.in/eticketing/protected/mapps1/trnscheduleenquiry/' + trainNumber;
		//let response = await fetch(apiUrl);
		let response = await fetch(apiUrl, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "greq": "0"
                }
            });
		let data = await response.json();
		let bounds = new google.maps.LatLngBounds();
		const pathCoordinates = [];
		const stationData = [];
		const ts_fromStationsList = document.getElementById("ts-fromStationsList");
		const ts_toStationsList = document.getElementById("ts-toStationsList");

		ts_fromStationsList.innerHTML = '';
		ts_toStationsList.innerHTML = '';

		if(data.stationList != null) {
			for (let i = 0; i < data.stationList.length; i++) {
				let station = data.stationList[i];

				stationData.push(station);
				let option = document.createElement("option");
				option.value = station.stnSerialNumber + ' - ' + station.stationName + ' (' + station.stationCode + ')';
				ts_fromStationsList.appendChild(option);
				
				option = document.createElement("option");
				option.value = station.stnSerialNumber + ' - ' + station.stationName + ' (' + station.stationCode + ')';
				ts_toStationsList.appendChild(option);

				let selectedStation = stationsData.find(stn => stn.code === station.stationCode);
				if (selectedStation) {
					addMarker(selectedStation, bounds);

					var location = { lat: selectedStation.latitude, lng: selectedStation.longitude };
					pathCoordinates.push(location);

					animateFitBounds(map, bounds);
				}
			}
			populateTable(stationData);
			polyline = new google.maps.Polyline({
				path: pathCoordinates, // The path of the line
				geodesic: true, // Smooth curve on earth's surface
				strokeColor: "#FF0000", // Red color
				strokeOpacity: 1.0, // Full opacity
				strokeWeight: 3 // Line thickness
			});

			polyline.setMap(map); // Add the line to the map
			//map.fitBounds(bounds);
			animateFitBounds(map, bounds);
		}
	} catch (error) {
		console.error("Error fetching stationList:", error);
	}
}

function animateFitBounds(map, bounds) {
	// Calculate center of bounds
	const center = bounds.getCenter();

	// Pan to the center
	map.panTo(center);

	// After panning, adjust the zoom level
	google.maps.event.addListenerOnce(map, 'idle', function () {
	// Calculate zoom level that would fit the bounds
	const listener = google.maps.event.addListener(map, "bounds_changed", function () {
		if (map.getZoom() > 15) map.setZoom(15); // Optionally limit zoom
		google.maps.event.removeListener(listener);
	});
	map.fitBounds(bounds);
	});
}

function clearMarkers() {
	markers.forEach(marker => marker.setMap(null)); // Remove markers from map
	markers = []; // Empty the array
	
	if(polyline != null)
	{
		polyline.setMap(null); // Remove polyline from map
		polyline = null;
	}

	const tableBody = document.querySelector("#ts-dataTable tbody");
	tableBody.innerHTML = ""; // Clear existing table data
	
	const ts_fromStationsList = document.getElementById("ts-fromStationsList");
	ts_fromStationsList.innerHTML = ""; // Clear existing ts-fromStationsList
	
	const ts_toStationsList = document.getElementById("ts-toStationsList");
	ts_toStationsList.innerHTML = ""; // Clear existing ts-toStationsList
}

function populateTable(stationData) {
	const tableBody = document.querySelector("#ts-dataTable tbody");
	tableBody.innerHTML = ""; // Clear existing table data

	stationData.forEach(station => {
		const row = document.createElement("tr");
		row.innerHTML = `
                    <td>${station.stnSerialNumber}</td>
                    <td>${station.stationName}</td>
                    <td>${station.stationCode}</td>
                    <td>${station.arrivalTime}</td>
                    <td>${station.departureTime}</td>
                    <td>${station.routeNumber}</td>
                    <td>${station.haltTime}</td>
                    <td>${station.distance}</td>
                    <td>${station.dayCount}</td>
                    <td>${(station.boardingDisabled?"No":"Yes")}</td>
                `;
		tableBody.appendChild(row);
	});
}

function showPanel(panelId) {
	var panels = document.querySelectorAll('.content');
	panels.forEach(panel => panel.classList.remove('active'));
	document.getElementById(panelId).classList.add('active');
}

async function loadTrainComposition() {
	const rc_trains = document.getElementById("rc-trains");
	const rc_fromStation = document.getElementById("rc-fromStation");
	const rc_toStation = document.getElementById("rc-toStation");

	const trainNumber = rc_trains.value.substring(0, rc_trains.value.indexOf("-")).trim();
	const dateValue = document.getElementById('rc-calendar').value;
	const fromStationCode = rc_fromStation.value.substring(rc_fromStation.value.indexOf('(') + 1).replace(')','').trim();
	const toStationCode = rc_toStation.value.substring(rc_toStation.value.indexOf('(') + 1).replace(')','').trim();

	if(isNaN(trainNumber) || trainNumber == null || trainNumber == ''){
		showSnackbar('Enter Train Name / Number');
		return;
	}
	else if(dateValue == null || dateValue == ''){
		showSnackbar('Select Date');
		return;
	}
	else if(fromStationCode == null || fromStationCode == ''){
		showSnackbar('Select From Station');
		return;
	}
	else if(toStationCode == null || toStationCode == ''){
		showSnackbar('Select To Station');
		return;
	}

	const tableBody = document.querySelector("#rc-dataTable tbody");
	tableBody.innerHTML = ""; // Clear existing table data

	const payload = {
		trainNo: trainNumber,
		jDate: dateValue,
		boardingStation: fromStationCode
	};
	const apiUrl = 'https://www.irctc.co.in/online-charts/api/trainComposition';
	let response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    const data = await response.json();
	if(data.cdd != null) {
		for (let i = 0; i < data.cdd.length; i++) {
			let coachData = data.cdd[i];

			const payload = {
				trainNo: data.trainNo,
				boardingStation: fromStationCode,
				remoteStation: fromStationCode,
				trainSourceStation: data.from,
				jDate: dateValue,
				coach: coachData.coachName,
				cls: coachData.classCode
			};

			loadCoachComposition(payload, i==(data.cdd.length-1));
		}		
	}
	else if(data.error != null)
	{
		showSnackbar(data.error);
	}
}

function showSnackbar(error) {
	const snackbar = document.getElementById("snackbar");
	snackbar.innerHTML = error;
	snackbar.classList.add("show");
	setTimeout(() => {
	  snackbar.classList.remove("show");
	}, 3000); // visible for 3 seconds
}

async function loadCoachComposition(payload, last) {
	const apiUrl = 'https://www.irctc.co.in/online-charts/api/coachComposition';
	let response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

	const tableBody = document.querySelector("#rc-dataTable tbody");
    const data = await response.json();
	if(data.bdd != null) {
		for (let i = 0; i < data.bdd.length; i++) {
			let berthData = data.bdd[i];
			const berthNo = berthData.berthNo;
			const berthCode = berthData.berthCode;

			if(berthData.bsd != null) {
				const bsd = berthData.bsd.filter((item, index, self) =>
				  index === self.findIndex(i => i.from === item.from && i.to === item.to)
				);
				for (let i = 0; i < bsd.length; i++) {
					if(!bsd[i].occupancy)
					{
						let serialNumber = tableBody.children.length + 1;
						const row = document.createElement("tr");
						row.innerHTML = `
							<td>${serialNumber}</td>
							<td>${berthData.from} - ${berthData.to}</td>
							<td>${bsd[i].from}</td>
							<td>${bsd[i].to}</td>
							<td>${data.coachName}</td>
							<td>${berthData.berthNo}</td>
							<td>${berthData.berthCode}</td>
							<td>${berthData.cabinCoupe?berthData.cabinCoupe:"-"}</td>
							<td>${berthData.cabinCoupeNameNo?berthData.cabinCoupeNameNo:"-"}</td>
						`;
						tableBody.appendChild(row);
					}
				}
			}
		}
	}
	else if(data.error != null)
	{
		showSnackbar(data.error);
	}
	if(last)
		populateHeaderFilters(-1);
}

function populateHeaderFilters(index) {
	const table = document.getElementById("rc-dataTable");
	const dropdownRow = table.querySelector("thead .filters");
	const selects = dropdownRow.querySelectorAll("select");

	selects.forEach((select, colIndex) => {
		if(index !== colIndex) {
			const uniqueValues = new Set();
			const rows = table.querySelectorAll("tbody tr");

			rows.forEach(row => {
				if(row.style.display !== "none") {
					const cellValue = row.cells[colIndex].textContent.trim();
					uniqueValues.add(cellValue);
				}
			});

			// Remove old options except the first one ("All")
			select.length = 1;
			[...uniqueValues].sort().forEach(val => {
				const option = document.createElement("option");
				option.value = val;
				option.textContent = val;
				select.appendChild(option);
			});

			// Attach the filter handler
			//select.addEventListener("change", filterTable);
		}
	});
}

function filterTable(index) {
	const table = document.getElementById("rc-dataTable");
	const rows = table.querySelectorAll("tbody tr");
	const dropdownRow = table.querySelector("thead .filters");
	const selects = dropdownRow.querySelectorAll("select");

    rows.forEach(row => {
		let visible = true;
		selects.forEach((select, colIndex) => {
			if(index == colIndex) {
				const filter = select.value;
				const cellValue = row.cells[colIndex].textContent.trim();
				if (filter && cellValue !== filter) {
					visible = false;
				}
			}
		});
		row.style.display = visible ? "" : "none";
    });
	populateHeaderFilters(index);
}

window.onload = function() {
	var rc_calendar = document.getElementById('rc-calendar');
	var today = new Date();
	var yesterday = new Date();
	var tomorrow = new Date();
	
	yesterday.setDate(today.getDate() - 1);
	tomorrow.setDate(today.getDate() + 1);
	
	var todayStr = today.toISOString().split('T')[0];
	var yesterdayStr = yesterday.toISOString().split('T')[0];
	var tomorrowStr = tomorrow.toISOString().split('T')[0];
	
	rc_calendar.value = todayStr;
	rc_calendar.setAttribute('min', yesterdayStr);
	rc_calendar.setAttribute('max', tomorrowStr);
};