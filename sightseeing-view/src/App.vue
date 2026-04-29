<template>
  <div id="app">
    <router-view />
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Space+Grotesk:wght@400;500;600;700&display=swap');

:root {
  --ink-900: #111214;
  --ink-700: #4a5568;
  --sand-50: #faf8f2;
  --sand-100: #f2ecdd;
  --sand-200: #e6dcc4;
  --teal-500: #2a9d8f;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: 'Space Grotesk', sans-serif;
  color: var(--ink-900);
  background:
    radial-gradient(circle at 12% 18%, rgba(42, 157, 143, 0.16), transparent 55%),
    radial-gradient(circle at 88% 15%, rgba(224, 122, 95, 0.18), transparent 50%),
    linear-gradient(135deg, var(--sand-50), var(--sand-100) 55%, var(--sand-200));
}

#app {
  min-height: 100vh;
}

a {
  color: inherit;
  text-decoration: none;
}
</style>
