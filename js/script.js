const games = [
    { title: 'BeamNG.drive',   genre: 'Simulation', image: 'beamng.webp',    page: 'index.html' },
    { title: 'Minecraft',      genre: 'Sandbox',    image: 'minecraft.webp', page: 'minecraft.html' },
    { title: 'Cyberpunk 2077', genre: 'Action RPG', image: 'cyberpunk.webp', page: 'cyberpunk.html' },
    { title: 'GTA V',          genre: 'Action',     image: 'gta5.webp',      page: 'gta5.html' },
    { title: 'Red Dead Redemption 2', genre: 'Western Action-Adventure', image: 'rdr2.webp', page: 'rdr2.html' },
    { title: 'Counter-Strike 2', genre: 'Tactical Shooter', image: 'cs2.webp', page: 'cs2.html' }
];

const $ = id => document.getElementById(id);

const storage = {
    get(key) {
        try {
            return localStorage.getItem(key);
        } catch {
            return null;
        }
    },

    set(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch {}
    },

    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch {}
    }
};


// l/d themes
const themeButton = $('theme-toggle');

function applyTheme(theme) {
    const isDark = theme === 'dark';

    document.body.classList.toggle('dark', isDark);
    themeButton.textContent = isDark ? 'Light mode' : 'Dark mode';
    themeButton.setAttribute('aria-pressed', String(isDark));
}

applyTheme(storage.get('games-theme') || 'light');

themeButton.addEventListener('click', () => {
    const next = document.body.classList.contains('dark') ? 'light' : 'dark';

    storage.set('games-theme', next);
    applyTheme(next);
});


// Search/Filter
const queryInput = $('game-query');

function renderGames() {
    const query = queryInput.value.trim().toLowerCase();
    const matches = games.filter(game => (game.title + ' ' + game.genre).toLowerCase().includes(query));

    $('search-status').textContent = `${matches.length} game(s) found.`;

    const container = $('game-results');
    container.replaceChildren();

    matches.forEach(game => {
        const card = document.createElement('article');
        card.className = 'result-card';

        const image = document.createElement('img');
        image.src = 'images/' + game.image;
        image.alt = game.title;

        const title = document.createElement('h3');
        title.textContent = game.title;

        const genre = document.createElement('p');
        genre.textContent = game.genre;

        const link = document.createElement('a');
        link.href = game.page;
        link.textContent = 'Open game page';

        card.append(image, title, genre, link);
        container.append(card);
    });

    storage.set('last-game-search', query);
}

queryInput.value = storage.get('last-game-search') || '';
queryInput.addEventListener('input', renderGames);
renderGames();


// Custom validation
const emailValid = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const phoneValid = value => /^\+?[0-9][0-9\s()\-]{7,18}$/.test(value);
const passwordValid = value => value.length >= 8 && /[A-Za-z]/.test(value) && /\d/.test(value);

$('signup-form').addEventListener('submit', event => {
    event.preventDefault();

    const name = $('signup-name').value.trim();
    const email = $('signup-email').value.trim();
    const phone = $('signup-phone').value.trim();
    const password = $('signup-password').value;

    let error = '';

    if (!name || !email || !phone || !password) {
        error = 'Please fill in all fields.';
    } else if (!emailValid(email)) {
        error = 'Enter a valid email address.';
    } else if (!phoneValid(phone)) {
        error = 'Enter a valid phone number.';
    } else if (!passwordValid(password)) {
        error = 'Password must be at least 8 characters and include a letter and a number.';
    }

    if (error) {
        $('signup-message').textContent = error;
        return;
    }

    storage.set('games-user', JSON.stringify({ name, email, phone, password }));

    $('signup-message').textContent = 'Account created. You can now log in.';
    $('login-email').value = email;
    $('signup-form').reset();
});

$('login-form').addEventListener('submit', event => {
    event.preventDefault();

    const email = $('login-email').value.trim();
    const password = $('login-password').value;
    const user = JSON.parse(storage.get('games-user') || 'null');

    if (!email || !password) {
        $('login-message').textContent = 'Enter your email and password.';
        return;
    }

    if (!emailValid(email)) {
        $('login-message').textContent = 'Enter a valid email address.';
        return;
    }

    if (!user || user.email !== email || user.password !== password) {
        $('login-message').textContent = 'Incorrect email or password. Please sign up first.';
        return;
    }

    storage.set('games-session', 'active');
    window.location.hash = 'profile';
    showProfile();
});

function showProfile() {
    const user = JSON.parse(storage.get('games-user') || 'null');
    const loggedIn = storage.get('games-session') === 'active' && user;

    $('profile').hidden = !loggedIn;
    $('account').hidden = Boolean(loggedIn);

    if (loggedIn) {
        $('profile-details').textContent = `Name: ${user.name} | Email: ${user.email} | Phone: ${user.phone}`;
    }
}

$('logout-button').addEventListener('click', () => {
    storage.remove('games-session');
    window.location.hash = '';
    showProfile();
});

window.addEventListener('hashchange', showProfile);
showProfile();


// CheapShark public API
$('load-deals').addEventListener('click', async () => {
    const status = $('api-status');
    const results = $('deal-results');

    status.textContent = 'Loading current game deals…';
    results.replaceChildren();
    $('load-deals').disabled = true;

    try {
        const response = await fetch('https://www.cheapshark.com/api/1.0/deals?storeID=1&pageSize=6');

        if (!response.ok) {
            throw new Error('The API returned an error.');
        }

        const deals = await response.json();

        if (!Array.isArray(deals) || !deals.length) {
            throw new Error('No deals are available right now.');
        }

        deals.forEach(deal => {
            const card = document.createElement('article');
            card.className = 'result-card deal-card';

            const image = document.createElement('img');
            image.src = deal.thumb;
            image.alt = '';

            const title = document.createElement('h3');
            title.textContent = deal.title;

            const price = document.createElement('p');
            price.textContent = `Current price: $${deal.salePrice} (was $${deal.normalPrice})`;

            const link = document.createElement('a');
            link.href = 'https://www.cheapshark.com/redirect?dealID=' + encodeURIComponent(deal.dealID);
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = 'View deal';

            card.append(image, title, price, link);
            results.append(card);
        });

        status.textContent = 'Game deals loaded successfully.';
    } catch (error) {
        status.textContent = `Could not load game deals: ${error.message} Check your connection and try again.`;
    } finally {
        $('load-deals').disabled = false;
    }
});
