const site = {
  // pathPrefix: '/', // Prefix for all links. If you deploy your site to example.com/portfolio your pathPrefix should be "portfolio"
  title: "xsh4n4's", // Navigation and site title
  titleAlt: "xsh4n4's", // Title for schema.org JSONLD
  // eslint-disable-next-line prettier/prettier
  description: 'Suhana Shaik is a Blockchain developer and cyber security enthusiast.',
  url: 'https://xsh4n4.github.io', // Domain of your site. No trailing slash!
  siteLanguage: 'en', // Language Tag on <html> element
  image: {
    // Used for SEO, relative to /static/ folder
    src: '/images/oneko-logo.jpg',
    width: 675,
    height: 675,
  },
  ogLanguage: 'en_US', // Facebook Language

  // Site config
  copyrights: `&copy; 2024&mdash;${new Date().getFullYear()} <a href="https://xsh4n4.vercel.app">Suhana Shaik</a>. All Rights Reserved.`,
  defaultTheme: 'light',
  postsPerPage: 10,

  // JSONLD / Manifest
  favicon: '/images/oneko-logo.jpg', // Used for manifest favicon generation
  shortName: "xsh4n4's", // shortname for manifest. MUST be shorter than 12 characters
  author: {
    // Author for schema.org JSONLD
    name: 'Suhana Shaik',
    url: 'https://xsh4n4.vercel.app',
  },
  themeColor: '#ffffff',
  backgroundColor: '#111111',
  



  // Social links and ids
  twitter: '@xsh4n4', // Twitter username
  twitterUrl: 'https://twitter.com/xsh4n4',
  linkedinUrl: 'https://www.linkedin.com/in/xsh4n4/',
  githubUrl: 'https://github.com/xsh4n4',
  whatsappUrl: 'https://wa.me/919705341003', // WhatsApp number with country code
  emailAddress: 'xsh4n4@gmail.com', // Email address
  emailUrl: 'mailto:xsh4n4@gmail.com',

  // tokens and keys
  githubApiToken: process.env.GITHUB_API_TOKEN,
  reCaptcha: {
    siteKey: '',
    secret:
      // eslint-disable-next-line max-len
      '',
  },


  // Menus - header(main) & footer
  mainMenu: [
    {
      title: 'Tags',
      path: '/',
    },
    {
      title: 'Write-ups',
      path: '/notes/',
    },
    {
      title: 'Articles',
      path: '/articles/',
    },
    {
      title: 'Works',
      path: '/works/',
    },
    {
      title: 'About',
      path: '/about/',
    },
    {
      title: 'Contact',
      path: '/contact/',
    },
  ],
  
}

export default site;