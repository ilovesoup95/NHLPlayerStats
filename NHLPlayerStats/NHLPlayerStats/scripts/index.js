// For an introduction to the Blank template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkID=397704
// To debug code on page load in Ripple or on Android devices/emulators: launch your app, set breakpoints, 
// and then run "window.location.reload()" in the JavaScript Console.
(function () {
	"use strict";

	////////// CORDOVA
	document.addEventListener('deviceready', onDeviceReady.bind(this), false);

	function onDeviceReady() {
		// Handle the Cordova pause and resume events
		document.addEventListener('pause', onPause.bind(this), false);
		document.addEventListener('resume', onResume.bind(this), false);

		// TODO: Cordova has been loaded. Perform any initialization that requires Cordova here.
		generateSelectOptions();
		selectNearestTeam();
		initializeData();
		document.getElementById("teamSelect").onchange = teamSelect_onChange;
		$("#teamSelect").removeAttr("disabled");
	};

	function onPause() {
		// TODO: This application has been suspended. Save application state here.
	};

	function onResume() {
		// TODO: This application has been reactivated. Restore application state here.
	};
	////////// ...CORDOVA

	////////// Globals
	var pagesDownloaded = 0;
	var players = new Array();
	var statsFileEntry;
	////////// ...Globals

	////////// Constants and definitions
	var stats = {
		name: { label: "name", column: 1, comparer: compareNames, sortingComparer: undefined },
		team: { label: "team", column: 2, comparer: undefined, sortingComparer: undefined },
		pos: { label: "pos", column: 3, comparer: undefined, sortingComparer: undefined },
		gamesPlayed: { label: "gamesPlayed", column: 4, comparer: undefined, sortingComparer: undefined },
		goals: { label: "goals", column: 5, comparer: compareGoals, sortingComparer: goalsSortingComparer },
		assists: { label: "assists", column: 6, comparer: compareAssists, sortingComparer: assistsSortingComparer },
		points: { label: "points", column: 7, comparer: comparePoints, sortingComparer: pointsSortingComparer },
		plusMinus: { label: "plusMinus", column: 8, comparer: comparePlusMinus, sortingComparer: undefined },
		avgTime: { label: "avgTime", column: 21, comparer: undefined, sortingComparer: undefined }
	};

	var teams = {
		anaheim: { id: 2, location: "Anaheim", name: "Ducks", coords: { lat: 33.8361, long: -117.8897 } },
		arizona: { id: 29, location: "Arizona", name: "Coyotes", coords: { lat: 33.4500, long: -112.0667 } },
		boston: { id: 7, location: "Boston", name: "Bruins", coords: { lat: 42.3581, long: -71.0636 } },
		buffalo: { id: 8, location: "Buffalo", name: "Sabres", coords: { lat: 42.9047, long: -78.8494 } },
		calgary: { id: 22, location: "Calgary", name: "Flames", coords: { lat: 51.0500, long: -114.0667 } },
		carolina: { id: 13, location: "Carolina", name: "Hurricanes", coords: { lat: 35.7806, long: -78.6389 } },
		chicago: { id: 17, location: "Chicago", name: "Blackhawks", coords: { lat: 41.8369, long: 87.6847 } },
		colorado: { id: 23, location: "Colorado", name: "Avalanche", coords: { lat: 39.7392, long: -104.9847 } },
		colombus: { id: 18, location: "Colombus", name: "Blue Jackets", coords: { lat: 39.9830, long: -82.9830 } },
		dallas: { id: 27, location: "Dallas", name: "Stars", coords: { lat: 32.7758, long: -96.7967 } },
		detroit: { id: 19, location: "Detroit", name: "Red Wings", coords: { lat: 42.3314, long: 83.0458 } },
		edmonton: { id: 24, location: "Edmonton", name: "Oilers", coords: { lat: 53.5330, long: -113.5000 } },
		florida: { id: 14, location: "Florida", name: "Panthers", coords: { lat: 26.1572, long: -80.2861 } },
		losAngeles: { id: 28, location: "Los Angeles", name: "Kings", coords: { lat: 34.0500, long: -118.2500 } },
		minnesota: { id: 25, location: "Minnesota", name: "Wild", coords: { lat: 44.9442, long: -93.0936 } },
		montreal: { id: 9, location: "Montreal", name: "Canadiens", coords: { lat: 45.5000, long: -73.5667 } },
		nashville: { id: 20, location: "Nashville", name: "Predators", coords: { lat: 36.1667, long: -86.7833 } },
		newJersey: { id: 3, location: "New Jersey", name: "Devils", coords: { lat: 40.7242, long: -74.1726 } },
		newYorkI: { id: 4, location: "New York", name: "Islanders", coords: { lat: 40.7049, long: -73.5838 } },
		newYorkR: { id: 5, location: "New York", name: "Rangers", coords: { lat: 40.7177, long: -74.0119 } },
		ottawa: { id: 10, location: "Ottawa", name: "Senators", coords: { lat: 45.4208, long: -75.6900 } },
		philadelphia: { id: 1, location: "Philadelphia", name: "Flyers", coords: { lat: 39.9500, long: -75.1667 } },
		pittsburgh: { id: 6, location: "Pittsburgh", name: "Penguins", coords: { lat: 40.4417, long: -80.0000 } },
		sanJose: { id: 30, location: "San Jose", name: "Sharks", coords: { lat: 37.3330, long: -121.9000 } },
		stLouis: { id: 21, location: "St. Louis", name: "Blues", coords: { lat: 38.6272, long: -90.1978 } },
		tampaBay: { id: 15, location: "Tampa Bay", name: "Lightning", coords: { lat: 27.9472, long: -82.4586 } },
		toronto: { id: 11, location: "Toronto", name: "Maple Leafs", coords: { lat: 43.7000, long: -79.4000 } },
		vancouver: { id: 26, location: "Vancouver", name: "Canucks", coords: { lat: 49.2500, long: -123.1000 } },
		washington: { id: 16, location: "Washington", name: "Capitals", coords: { lat: 38.8951, long: -77.0367 } },
		winnipeg: { id: 12, location: "Winnipeg", name: "Jets", coords: { lat: 49.8994, long: -97.1392 } }
	};

	var urlHelper = {
		getStatsUrl: function (page) {
			return this.baseUrl +
				this.statAttDefault + "&" +
				this.sortAttDefault + "&" +
				this.pageLabel + page + "&" +
				this.searchAttDefault + "&" +
				this.tabsAttDefault + "&" +
				this.teamAttDefault + "&" +
				this.positionAttDefault;
		},

		baseUrl: "http://www.rds.ca/hockey/lnh/statistiques?",
		pageLabel: "pageIndex=",
		statAttDefault: "sort_col=points",
		teamAttDefault: "teamFilter=all",
		positionAttDefault: "positionFilter=all",
		sortAttDefault: "sort_order=desc",
		searchAttDefault: "searchString=",
		tabsAttDefault: "tabs_index=2",

		getImgSrc: function (teamId, isLarge) {
			return this.imgSrcPrefix + (isLarge ? this.imgSizeLabelLarge : this.imgSizeLabelSmall) + teamId + this.imgSrcSuffix;
		},

		imgSrcPrefix: "http://rdsmedia.cookieless.ca/sports/hockey/nhl/team/",
		imgSizeLabelSmall: "35x17/",
		imgSizeLabelLarge: "50x50/",
		imgSrcSuffix: ".png"
	};

	var positions = {
		all: "all",
		d: "D"
	};

	var tables = [
		{ id: "points_all", stat: stats.points, pos: positions.all },
		{ id: "goals_all", stat: stats.goals, pos: positions.all },
		{ id: "assists_all", stat: stats.assists, pos: positions.all },
		{ id: "points_d", stat: stats.points, pos: positions.d },
		{ id: "goals_d", stat: stats.goals, pos: positions.d },
		{ id: "assists_d", stat: stats.assists, pos: positions.d }
	];

	function NhlPlayer(name, team, pos, gamesPlayed, goals, assists, plusMinus, avgTime) {
		this.name = name;
		this.team = parseInt(team);
		this.pos = pos;
		this.gamesPlayed = parseInt(gamesPlayed);
		this.goals = parseInt(goals);
		this.assists = parseInt(assists);
		this.points = this.goals + this.assists;
		this.plusMinus = parseInt(plusMinus);
		this.avgTime = avgTime;
	}

	// RDS Constants
	var pagesToFetch = 3; // Fetch only 4 pages of stats
	var playersPerPage = 50;
	// ...RDS Constants

	var playersPerTable = 10;
	var selectedTeam = teams.montreal.id;
	var statsFileName = "stats.dat";
	var statsCacheDuration = 1 * 1000 * 60;
	////////// ...Constants and definitions

	////////// Functions
	function generateSelectOptions() {
		var slct = document.getElementById("teamSelect");
		for (var team in teams) {
			if (!teams.hasOwnProperty(team)) {
				continue;
			}
			var option = document.createElement("option");
			option.value = teams[team].id;
			var teamStr = teams[team].location + " " + teams[team].name;
			option.appendChild(document.createTextNode(teamStr));
			slct.appendChild(option);
		}
	};

	function selectNearestTeam() {

	};

	function teamSelect_onChange(e) {
		selectedTeam = parseInt($("#teamSelect option:selected").val());
		$("table").remove();
		$(".spinner").toggleClass("hidden");
		document.getElementById("teamImg").src = urlHelper.getImgSrc(selectedTeam, true);
		displayStats();
	};

	function fileErrorHandler(e) {
		console.log(e.code);
	};

	function initializeData() {
		window.requestFileSystem(LocalFileSystem.PERSISTENT, 2 * 1024 * 1024, gotFileSystem, fileErrorHandler);
	};

	function gotFileSystem(fs) {
		fs.root.getFile(statsFileName, { create: true, exclusive: false }, gotFileEntry, fileErrorHandler);
	};

	function gotFileEntry(fe) {
		statsFileEntry = fe;
		fe.file(gotFile, fileErrorHandler);
	};

	function gotFile(f) {
		var reader = new FileReader();
		reader.onloadend = function (e) {
			loadStats(this.result);
		};
		reader.readAsText(f);
	};

	function loadStats(fileContent) {
		var lines = fileContent.split("\n");
		if (newDataNeeded(lines)) {
			loadFromWeb();
		} else {
			loadFromFile(lines);
		}
	};

	function newDataNeeded(fileLines) {
		var lastUpdate = new Date(fileLines[0]);
		var now = new Date();

		if (lastUpdate.toString() === "Invalid Date" || now - lastUpdate > statsCacheDuration || fileLines.length - 3 < pagesToFetch * playersPerPage) {
			return true;
		}

		return false;
	};

	function loadFromFile(lines) {
		for (var i = 1; i < lines.length; i++) {
			if (lines[i] === "\n") {
				break;
			}

			var playerInfo = lines[i].split(";");
			players[players.length] = new NhlPlayer(playerInfo[0], playerInfo[1], playerInfo[2], playerInfo[3], playerInfo[4], playerInfo[5], playerInfo[7], playerInfo[8]);
		}
		displayStats();
	};

	function loadFromWeb() {
		for (var i = 0; i < pagesToFetch; i++) {
			var url = urlHelper.getStatsUrl(i);
			httpGet(url, extractStats);
		}
	};

	function getTeamFromImgSrc(imgSrc) {
		var lengthToExtract = imgSrc.length - (urlHelper.imgSrcPrefix.length + urlHelper.imgSizeLabelSmall.length + urlHelper.imgSrcSuffix.length);
		return imgSrc.substr(urlHelper.imgSrcPrefix.length + urlHelper.imgSizeLabelSmall.length, lengthToExtract);
	};

	function getSecondsFromAvgTime(avgTimeStr) {
		var time = avgTimeStr.split(":");
		return time[0] * 60 + time[1];
	};

	function httpGet(url, callback) {
		var xmlhttp;
		if (window.XMLHttpRequest) {
			xmlhttp = new XMLHttpRequest();
		}

		xmlhttp.onreadystatechange = function () {
			if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
				callback(xmlhttp.responseText);
			}
		};

		xmlhttp.open("GET", url, true);
		xmlhttp.send();
	};

	function extractStats(htmlContent) {
		var newPlayers = new Array(playersPerPage);
		var count = 0;
		$(htmlContent).find(".table.stats tbody tr").each(function (index, value) {
			var name = $(this).find("td:nth-child(" + stats.name.column + ")").text();
			var team = getTeamFromImgSrc($(this).find("img").attr("src"));
			var pos = $(this).find("td:nth-child(" + stats.pos.column + ")").text();
			var gamesPlayed = $(this).find("td:nth-child(" + stats.gamesPlayed.column + ")").text();
			var goals = $(this).find("td:nth-child(" + stats.goals.column + ")").text();
			var assists = $(this).find("td:nth-child(" + stats.assists.column + ")").text();
			var plusMinus = $(this).find("td:nth-child(" + stats.plusMinus.column + ")").text();
			var avgTime = $(this).find("td:nth-child(" + stats.avgTime.column + ")").text();

			newPlayers[count] = new NhlPlayer(name, team, pos, gamesPlayed, goals, assists, plusMinus, getSecondsFromAvgTime(avgTime));
			count++;
		});

		Array.prototype.push.apply(players, newPlayers);

		pagesDownloaded++;
		if (pagesDownloaded == pagesToFetch) {
			updateStatsFile();
			displayStats();
		}
	};

	function updateStatsFile() {
		statsFileEntry.createWriter(function (fileWriter) {
			var linesToWrite = new Array(players.length + 2);
			fileWriter.seek(0);
			var now = new Date().toString();
			linesToWrite[0] = now;
			for (var i = 0; i < players.length; i++) {
				var p = players[i];
				var playerString = [p.name, p.team, p.pos, p.gamesPlayed, p.goals, p.assists, p.points, p.plusMinus, p.avgTime].join(";");
				linesToWrite[i + 1] = playerString;
			}
			linesToWrite[linesToWrite.length - 1] = "\n";
			var statsString = linesToWrite.join("\n");
			fileWriter.write(statsString);
		}, fileErrorHandler);
	};

	function displayStats() {
		var defensemen = players.filter(function (x) { return x.pos == positions.d });

		for (var i = 0; i < tables.length; i++) {
			var relevantPlayers = tables[i].pos === positions.d ? defensemen : players;
			relevantPlayers.sort(stats[tables[i].stat.label].sortingComparer);
			$("#" + tables[i].id + " > .spinner").toggleClass("hidden");
			createTable(tables[i].id, tables[i].stat, relevantPlayers);
		}
	};

	function createTd(parentRow, text) {
		var td = document.createElement("TD");
		if (text !== undefined && text !== "") {
			td.appendChild(document.createTextNode(text));
		}
		parentRow.appendChild(td);
		return td;
	};

	function createTable(tableId, stat, relevantPlayers) {
		var tableDiv = document.getElementById(tableId);
		var table = document.createElement("TABLE");
		tableDiv.appendChild(table);
		var tBody = document.createElement("TBODY");
		table.appendChild(tBody);

		var currentRank = 0;
		var currentIndex = 0;

		for (; currentIndex < playersPerTable; currentIndex++) {
			var tr = document.createElement("TR");
			tBody.appendChild(tr);
			if (relevantPlayers[currentIndex].team === selectedTeam) {
				$(tr).toggleClass("fav");
			}

			var nextRank = getRank(currentRank, currentIndex, stat, relevantPlayers);
			if (nextRank !== currentRank) {
				currentRank = nextRank;
				createTd(tr, currentRank);
			} else {
				createTd(tr);
			}

			var td = createTd(tr);
			var img = document.createElement("IMG");
			img.src = urlHelper.getImgSrc(relevantPlayers[currentIndex].team);
			td.appendChild(img);

			createTd(tr, relevantPlayers[currentIndex].name);

			createTd(tr, relevantPlayers[currentIndex][stat.label]);
		}

		for (; currentIndex < relevantPlayers.length; currentIndex++) {
			var nextRank = getRank(currentRank, currentIndex, stat, relevantPlayers);
			if (nextRank !== currentRank) {
				currentRank = nextRank;
			}

			if (relevantPlayers[currentIndex].team === selectedTeam) {
				var tr = document.createElement("TR");
				tBody.appendChild(tr);
				$(tr).toggleClass("fav nextFav");

				createTd(tr, nextRank);

				var td = createTd(tr);
				var img = document.createElement("IMG");
				img.src = urlHelper.getImgSrc(relevantPlayers[currentIndex].team);
				td.appendChild(img);

				createTd(tr, relevantPlayers[currentIndex].name);

				createTd(tr, relevantPlayers[currentIndex][stat.label]);
				break;
			}
		}
	};

	function getRank(currentRank, currentIndex, stat, relevantPlayers) {
		if (currentIndex === 0) {
			return 1;
		}

		if (stat.comparer(relevantPlayers[currentIndex], relevantPlayers[currentIndex - 1]) === 0) {
			return currentRank;
		}

		return currentIndex + 1;
	};

	// Comparers
	function pointsSortingComparer(p1, p2) {
		var cmp = comparePoints(p1, p2);
		if (cmp !== 0) {
			return cmp;
		}

		cmp = compareGoals(p1, p2);
		if (cmp !== 0) {
			return cmp;
		}

		return compareBase(p1, p2);
	};

	function goalsSortingComparer(p1, p2) {
		var cmp = compareGoals(p1, p2);
		if (cmp !== 0) {
			return cmp;
		}

		cmp = comparePoints(p1, p2);
		if (cmp !== 0) {
			return cmp;
		}

		return compareBase(p1, p2);
	};

	function assistsSortingComparer(p1, p2) {
		var cmp = compareAssists(p1, p2);
		if (cmp !== 0) {
			return cmp;
		}

		cmp = comparePoints(p1, p2);
		if (cmp !== 0) {
			return cmp;
		}

		return compareBase(p1, p2);
	};

	function comparePoints(p1, p2) {
		return p2.points - p1.points;
	};

	function compareGoals(p1, p2) {
		return p2.goals - p1.goals;
	};

	function compareAssists(p1, p2) {
		return p2.assists - p1.assists;
	};

	function comparePPS(p1, p2) {
		var pps1 = p1.points / (p1.gamesPlayed * p1.avgTime);
		var pps2 = p2.points / (p2.gamesPlayed * p2.avgTime);
		if (pps1 > pps2) {
			return -1;
		} else if (pps1 < pps2) {
			return 1;
		} else {
			return 0;
		}
	};

	function comparePlusMinus(p1, p2) {
		return p2.plusMinus - p1.plusMinus;
	};

	function compareNames(p1, p2) {
		if (p1.name > p2.name) {
			return 1;
		} else if (p1.name < p2.name) {
			return -1;
		} else {
			return 0;
		}
	};

	function compareBase(p1, p2) {
		var cmp = comparePPS(p1, p2);
		if (cmp !== 0) {
			return cmp;
		}

		cmp = comparePlusMinus(p1, p2);
		if (cmp !== 0) {
			return cmp;
		}

		return compareNames(p1, p2);
	};
	// ...Comparers
	////////// ...Functions
})();