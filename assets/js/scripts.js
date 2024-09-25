// Constants
const WEATHER_API_KEY = "5f31503fc12b144b0c80a0034508c878";
const BASE_API_URL = "https://api.openweathermap.org/data/2.5/forecast";
const METRIC_UNIT = "metric";
const DEFAULT_CITY = "Toronto";

// Elements
const searchHistoryEl = $('#searchHistory');
const cardArea = $('#forecastCards');
const searchButton = $('#btn-search1');
const citySearchInput = $('#citySearch');

// Retrieve search history from localStorage
let dataHistoryArray = JSON.parse(localStorage.getItem('dataHistory')) || [];

// Utility Functions
const convertToMPH = (speed) => (speed * 2.23693629).toFixed(2);

const formatDate = (date) => dayjs(date).format('M/D/YYYY');

const searchHistory = () => {
    localStorage.setItem('dataHistory', JSON.stringify(dataHistoryArray));
};

const weatherEmoji = (id) => {
    if (id >= 500 && id < 531) return '🌧️'; // Rain
    if (id >= 801 && id < 805) return ['🌤️', '⛅', '🌥️', '☁️'][id - 801]; // Clouds
    if (id >= 600 && id < 623) return '🌨️'; // Snow
    if (id >= 200 && id < 233) return '⛈️'; // Thunder
    if (id === 800) return '☀️'; // Clear sky
    return '';
};

// Display Functions
const displaySearchHistory = () => {
    searchHistoryEl.empty();
    const dataHistoryArrayReversed = [...dataHistoryArray].reverse();

    dataHistoryArrayReversed.forEach(city => {
        const searchCard = $('<button>')
            .addClass('border my-2 text-center rounded-1')
            .attr('type', 'button')
            .attr('id', city.city.name)
            .text(city.city.name);

        searchHistoryEl.append(searchCard);
    });
};

const displayForecastCard = (city) => {
    const emoji = weatherEmoji(city.list[0].weather[0].id);
    const windSpeed = convertToMPH(city.list[0].wind.speed);

    $('#cityName').addClass('fw-bold').text(`${city.city.name} (${formatDate(city.list[0].dt_txt)}) ${emoji}`);
    $('#temp').text(`Temp: ${city.list[0].main.temp}ºC`);
    $('#wind').text(`Wind: ${windSpeed} MPH`);
    $('#humidity').text(`Humidity: ${city.list[0].main.humidity}%`);
};

const generateCard = (weatherData) => {
    const emoji = weatherEmoji(weatherData.weather[0].id);
    const windSpeed = convertToMPH(weatherData.wind.speed);

    const cardSection = $('<section>').addClass('card col-lg-2 col-md-5 my-3 rounded-0 text-white px-1 myCards');
    const cardContent = [
        $('<p>').addClass('fw-bold m-0 p-1 ps-0').text(formatDate(weatherData.dt_txt)),
        $('<p>').addClass('m-0 p-1 ps-0').text(emoji),
        $('<p>').addClass('m-0 p-1 ps-0').text(`Temp: ${weatherData.main.temp}ºC`),
        $('<p>').addClass('m-0 p-1 ps-0').text(`Wind: ${windSpeed} MPH`),
        $('<p>').addClass('m-0 p-1 ps-0 pb-3').text(`Humidity: ${weatherData.main.humidity}%`),
    ];

    cardSection.append(cardContent);
    cardArea.append(cardSection);
};

const display5DayForecastCard = (citySearched) => {
    const cityData = dataHistoryArray.find(data => data.city.name.toLowerCase() === citySearched.toLowerCase());

    if (cityData) {
        cardArea.empty();
        dataHistoryArray = dataHistoryArray.filter(data => data.city.name !== citySearched);
        dataHistoryArray.push(cityData);
        searchHistory();

        displaySearchHistory();
        displayForecastCard(cityData);

        if (dayjs().diff(dayjs(cityData.list[0].dt_txt), 'd') < 1) {
            cityData.list.forEach((data, index) => {
                if (index % 8 === 0) generateCard(data);
            });
            return;
        }
    }

    fetchCity(citySearched);
};

// Fetching Data from API
const fetchCity = (city) => {
    fetch(`${BASE_API_URL}?q=${city},CA&units=${METRIC_UNIT}&appid=${WEATHER_API_KEY}`)
        .then(response => {
            if (!response.ok) throw new Error('City not found. Please ensure the spelling is correct.');
            return response.json();
        })
        .then(data => {
            dataHistoryArray.push(data);
            if (dataHistoryArray.length > 7) dataHistoryArray.shift();
            searchHistory();

            cardArea.empty();
            displayForecastCard(data);
            data.list.forEach((item, index) => {
                if (index % 8 === 0) generateCard(item);
            });
            displaySearchHistory();
        })
        .catch(error => alert(error.message));
};

// Event Listeners
$(document).ready(() => {
    displaySearchHistory();

    if (dataHistoryArray.length > 0) {
        const lastSearchedCity = dataHistoryArray[dataHistoryArray.length - 1].city.name;
        display5DayForecastCard(lastSearchedCity);
    } else {
        fetchCity(DEFAULT_CITY);
    }

    searchButton.on('click', (event) => {
        event.preventDefault();
        const citySearched = citySearchInput.val().trim();
        if (citySearched) {
            display5DayForecastCard(citySearched);
        } else {
            alert('Please enter a city before pressing search');
        }
    });

    searchHistoryEl.on('click', 'button', (event) => {
        display5DayForecastCard(event.target.id);
    });
});
