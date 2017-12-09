(function(){

  const APIBASE = 'https://pokeapi.co/api/v2/';
  const APP = document.getElementById('app');

  let DATA = {};

  const FETCHOPTIONS = {
    api:{ 
      method: 'GET',
      headers: new Headers({
        "Content-Type": "application/json",
      }),
      mode: 'cors',
      cache: 'default' 
    }
  }

  /**
   * Easy node selector
   * @param {string} selector 
   * @param {HTMLObject} target 
   * @returns {Array<HTMLObject>}
   */
  const $ = (selector, target = document) => {
    try{
      const nodes = target.querySelectorAll(selector);
      if (!nodes) return [];
      return [...nodes];
    }
    catch (exception){
      console.log(exception);
      return [];
    }
  };
  
  /**
   * Create a new DOM element
   * @param {string} type 
   * @returns {HTMLElement}
   */
  const el = type => document.createElement(type);

  /**
   * Save data to the browsers localStorage
   */
  function saveDataToBrowser(){
    return localStorage.setItem('pokemonInfo', JSON.stringify(DATA));
  }
  /**
   * Restores data from browsers localStorage
   */
  function restoreDataFromBrowser(){
    let data = localStorage.getItem('pokemonInfo');
    return JSON.parse(data);
  }

  /**
   * Get an array of pokemon. If none saved locally go to the server
   */
  async function getPokemon(){

    // Update the data once a day:
    if (!DATA.pokemon || !DATA.lastUpdate || DATA.lastUpdate <= Date.now() - 86400000){
      let response = await  fetch(APIBASE+'pokemon/?limit=811', FETCHOPTIONS.api);
      // only proceed once promise is resolved
      let data = await response.json();
      // only proceed once second promise is resolved
      DATA.pokemon = data.results;
      DATA.lastUpdate = Date.now();
    }

    return DATA.pokemon;
  }

  /**
   * Updates the 'data saved' state for the pokedex
   */
  function updatePokemonLoaded(){
    if(DATA.pokemon){
      const pokemonDOM = $('#pokemon-list li', APP);
      for(let i = 0; i < DATA.pokemon.length; i++){
        if (DATA.pokemon[i].data){
          pokemonDOM[i].classList.add('data-stored');
        } else {
          pokemonDOM[i].classList.remove('data-stored');
        }
      }
    }
  }

  async function displayPokemonList(){

    APP.className = '';

    let pokemon = await getPokemon();

    let list = el('ol');

    list.id = 'pokemon-list';

    for(let i = 0; i < pokemon.length; i++){
      let listItem = el('li');

      if(pokemon[i].data){
        listItem.classList.add('data-stored');
      }

      listItem.innerHTML = `<a href="#${pokemon[i].name}" data-id="${i+1}"><span class="pokemon-number">#${i+1}</span><span class="pokemon-name">${pokemon[i].name}</span></span>`;
      list.appendChild(listItem);
    }

    list.addEventListener('click', event=>{
      event.preventDefault();
      if (event.target.dataset.id){
        displayPokemon( $('.pokemon-name', event.target)[0].innerText, event.target.dataset.id);
      } else {
        return false;
      }
    });

    APP.appendChild(list);
  };

  /**
   * Get data for a particular pokemon
   */
  async function getPokemonData(n){
    let pokemon = await getPokemon();

    if (pokemon[n-1].data){
      return pokemon[n-1].data;
    }

    console.log('GET: '+APIBASE+'pokemon/'+n+'/');
    let apiResp = await fetch(APIBASE+'pokemon/'+n+'/', FETCHOPTIONS.api);
    let pokemonData = await apiResp.json();

    DATA.pokemon[n-1].data = pokemonData;

    return DATA.pokemon[n-1].data;
  }

  /**
   * Display the data for a particular pokemon
   * @param {object} data
   */
  async function displayPokemon(name, id) {

    APP.classList.add('show-pokemon');
    const pokemonInfo = el('table');
    pokemonInfo.classList.add('pokemon-info');
    pokemonInfo.innerHTML = `
    <thead>
      <tr>
        <td><span class="pokemon-number">#${id}</span></td>
        <td><h2><span class="pokemon-name">${name}</span></h2></td>
      </tr>
    </thead>`;


    APP.appendChild(pokemonInfo);

    const pokemonData = el('tbody');
    pokemonData.innerHTML = '<tr><td colspan="2"><img class="loading-image" src="images/loading.gif" alt="Loading"/></td></tr>';
    pokemonInfo.appendChild(pokemonData);


    const data = await getPokemonData(id);

    pokemonTypes = data.types.map( item => '<span>' + item.type.name + '</span>' ).join(', ');
    pokemonAbilities = data.abilities.map( item => '<span>' + item.ability.name + '</span>' ).join(', ');

    pokemonData.innerHTML = 
    `
    <tr> 
      <th>Sprites</th>
      <td>
        <div class="pokemon-sprites">
          <img src="${data.sprites['front_default']}" alt="Sprite Image" class="sprite-front sprite-normal"/>
          <img src="${data.sprites['back_default']}" alt="Sprite Image" class="sprite-back sprite-normal"/>
          <img src="${data.sprites['front_shiny']}" alt="Sprite Image" class="sprite-front sprite-shiny"/>
          <img src="${data.sprites['back_shiny']}" alt="Sprite Image" class="sprite-back sprite-shiny"/>
        </div>
        <label class="shiny-control">Shiny <input name="show-shiny" type="checkbox"/></label>
      </td>
    </tr>
      <tr>
        <th>Type:</th>
        <td>${pokemonTypes}</td>
      </tr>
      <tr>
        <th>Abilties:</th>
        <td>${pokemonAbilities}</td>
      </tr>
      <tr>
        <th>Height:</th>
        <td>${ (data.height / 10).toFixed(1) }m</td>
      </tr>
      <tr>
        <th>Weight:</th>
        <td>${ (data.weight / 10).toFixed(1) }kg</td>
      </tr>
    `;

    const tableFoot = el('tfoot');
    tableFoot.innerHTML = '<tr><td colspan="2"><a href="#" class="close-info">Back</a></td></tr>';
    pokemonInfo.appendChild(tableFoot);

    $('input[name="show-shiny"]', pokemonInfo)[0].addEventListener('change', event=>{
      $('.pokemon-sprites', pokemonInfo)[0].classList.toggle('shiny');
    });

    $('a.close-info', pokemonInfo)[0].addEventListener('click', event=>{
      event.preventDefault();
      APP.classList.remove('show-pokemon');
      pokemonInfo.remove();
    });

    updatePokemonLoaded();
    saveDataToBrowser();
  }


  try {
    let data = restoreDataFromBrowser();
    if (data){
      DATA = data;
    }
  } catch (err){
    console.log(err);
    DATA = {};
  }

  displayPokemonList();
  

})();
