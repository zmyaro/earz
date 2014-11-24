'use strict';

(function () {
	var URLS = {
		CHARTLYRICS_LYRIC: '/proxy/chartlyricslyric?q=',
		CHARTLYRICS_SONG: '/proxy/chartlyricssong',
		ITUNES: '/proxy/itunes?q=',
		SPOTIFY: '/proxy/spotify?q='
	};
	
	var TRANSITION_DURATION = 200; // Milliseconds
	
	/**
	 * Initialize the application.
	 */
	function init() {
		initSearchCard();
	}
	/**
	 * Set up event listeners for the search card.
	 */
	function initSearchCard() {
		var searchTypeForm = document.getElementById('searchTypeForm'),
			lyricSearchForm = document.getElementById('lyricSearchForm'),
			melodySearchForm = document.getElementById('melodySearchForm');
		
		// Change the visible search type when the option is changed.
		searchTypeForm.onchange = function (e) {
			localStorage.searchType = e.target.value;
			if (e.target.value === 'melody') {
				lyricSearchForm.style.display = 'none';
				melodySearchForm.style.display = 'block';
				melodySearchForm.firstElementChild.focus();
			} else {
				melodySearchForm.style.display = 'none';
				lyricSearchForm.style.display = 'block';
				lyricSearchForm.firstElementChild.focus();
			}
		};
		
		// Override the lyric search form.
		lyricSearchForm.onsubmit = function(e) {
			e.preventDefault();
			if (e.target.q.value !== '') {
				searchForLyric(e.target.q.value);
			}
		};
		
		
		// Load the last used search type from localStorage.
		if (localStorage.searchType === 'melody') {
			//searchTypeForm.searchType.value = 'melody';
			document.getElementById('melodySearchType').click();
		} else {
			//searchTypeForm.searchType.value = 'lyric';
			document.getElementById('lyricSearchType').click();
		}
	}
	
	/**
	 * Search for songs containing a particular lyric.
	 * @param {String} query - The lyric to search for
	 */
	function searchForLyric(query) {
		// Hide the results card while loading.
		document.getElementById('resultsCard').classList.add('hidden');
		document.getElementById('songCard').classList.add('hidden');
		
		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function () {
			if (xhr.readyState === 4) {
				if (xhr.status === 200) {
					if (xhr.responseXML) {
						showSearchResults(xhr.responseXML);
					} else {
						alert('Something went wrong while searching.');
					}
				} else {
					alert('A ' + xhr.status + ' error occurred while searching, likely because the API is misbehaving.');
				}
			}
		};
		xhr.open('GET', URLS.CHARTLYRICS_LYRIC + encodeURIComponent(query), true);
		xhr.send();
	}
	/**
	 * Process and display lyric search results.
	 * @param {XMLDocument} resultsXML - The search results
	 */
	function showSearchResults(resultsXML) {
		var results = resultsXML.getElementsByTagName('SearchLyricResult');
		
		// Get and clear the results list.
		var resultsList = document.getElementById('resultsList');
		resultsList.innerHTML = '';
		
		// Go through the results.
		for (var i = 0; i < results.length; i++) {
			// Skip any elements with no content.
			if (results[i].childNodes.length === 0) {
				continue;
			}
			
			var resultItem = document.createElement('li');
			var itemButton = document.createElement('button');
			itemButton.dataset.id = results[i].getElementsByTagName('LyricId')[0].childNodes[0].nodeValue;
			itemButton.dataset.checksum = results[i].getElementsByTagName('LyricChecksum')[0].childNodes[0].nodeValue;
			itemButton.dataset.title = results[i].getElementsByTagName('Song')[0].childNodes[0].nodeValue;
			itemButton.onclick = loadSong;
			
			var title = document.createElement('div');
			title.innerText = title.textContent = results[i].getElementsByTagName('Song')[0].childNodes[0].nodeValue;
			
			var artist = document.createElement('small');
			artist.innerText = artist.textContent = results[i].getElementsByTagName('Artist')[0].childNodes[0].nodeValue;
			
			itemButton.appendChild(title);
			itemButton.appendChild(artist);
			resultItem.appendChild(itemButton);
			resultsList.appendChild(resultItem);
		}
		// Show the results card.
		document.getElementById('resultsCard').classList.remove('hidden');
	}
	/**
	 * Load the song for the clicked button.
	 * @param {MouseEvent} e
	 */
	function loadSong(e) {
		var url = URLS.CHARTLYRICS_SONG;
		url += '?lyricId=' + encodeURIComponent(e.currentTarget.dataset.id);
		url += '&lyricCheckSum=' + encodeURIComponent(e.currentTarget.dataset.checksum);
		
		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function () {
			if (xhr.readyState === 4) {
				if (xhr.status === 200) {
					if (xhr.responseXML) {
						showSong(xhr.responseXML);
					} else {
						alert('Something went wrong while loading the song.');
					}
				} else {
					alert('A ' + xhr.status + ' error occurred while loading the song, likely because the API is misbehaving.');
				}
			}
		};
		xhr.open('GET', url, true);
		xhr.send();
		
		// Hide the search view.
		var searchAppBar = document.getElementById('searchAppBar');
		var searchContainer = document.getElementById('searchContainer');
		searchAppBar.classList.add('hidden');
		searchContainer.classList.add('hidden');
		setTimeout(function () {
			searchContainer.style.display = 'none';
		}, TRANSITION_DURATION);
		// Show the song view.
		var songAppBar = document.getElementById('songAppBar');
		var songContainer = document.getElementById('songContainer');
		songAppBar.style.display = null;
		songContainer.style.display = null;
		songAppBar.style.left = e.currentTarget.offsetLeft + 'px';
		songAppBar.style.right = (window.innerWidth - (e.currentTarget.offsetLeft + e.currentTarget.offsetWidth)) + 'px';
		songAppBar.style.top = (e.currentTarget.offsetTop - window.scrollY) + 'px';
		songAppBar.innerHTML = e.currentTarget.dataset.title;
		setTimeout(function () {
			songAppBar.classList.remove('hidden');
			songContainer.classList.remove('hidden');
			
			songAppBar.style.left = null;
			songAppBar.style.right = null;
			songAppBar.style.top = null;
		}, 1);
	}
	/**
	 * Display the lyrics for the selected song.
	 * @param {XMLDocument} songXML - The song's data
	 */
	function showSong(songXML) {
		var songCard = document.getElementById('songCard');
		songCard.innerHTML = '';
		
		var heading = document.createElement('h1');
		heading.innerText = heading.textContent = songXML.getElementsByTagName('LyricSong')[0].childNodes[0].nodeValue;
		var artist = document.createElement('small');
		artist.innerText = artist.textContent = songXML.getElementsByTagName('LyricArtist')[0].childNodes[0].nodeValue;
		var lyrics = document.createElement('pre');
		lyrics.innerText = lyrics.textContent = songXML.getElementsByTagName('Lyric')[0].childNodes[0].nodeValue;
		
		songCard.appendChild(heading);
		songCard.appendChild(artist);
		songCard.appendChild(lyrics);
		songCard.classList.remove('hidden');
	}
	
	
	window.onload = init;
})();
