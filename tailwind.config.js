const colors = require('tailwindcss/colors');

module.exports = {
    content: [
        './resources/scripts/**/*.{js,ts,tsx}',
    ],
    theme: {
        extend: {
            fontFamily: {
                jakarta: ['"Plus Jakarta Sans"', 'sans-serif'],
            },
            colors: {
                black: '#000000',
                primary: colors.blue,
                cyan: colors.cyan,
            },
            transitionDuration: {
                250: '250ms',
            },
            borderColor: theme => ({
                default: theme('colors.neutral.400', 'currentColor'),
            }),
        },
    },
    plugins: [
        // require('@tailwindcss/line-clamp'),
        require('@tailwindcss/forms')({
            strategy: 'class',
        }),
    ]
};