import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// import legacy from '@vitejs/plugin-legacy'
import path from 'path'


const projectRootDir = path.resolve(__dirname);


// https://vitejs.dev/config/
export default defineConfig({
    server: {
        // host: '192.168.6.7',
        port: 12306,
    },
    // css: {
    //     preprocessorOptions: {
    //         less: {
    //             modifyVars: {
    //                 // hack: `true; @import (reference) "${resolve('src/style/global/config.less')}";`,
    //             },
    //             javascriptEnabled: true,
    //         }
    //     }
    // },
    resolve: {
        alias: [
            { find: /^~/, replacement: '' },
            { find: /^@\/config/, replacement: path.resolve(projectRootDir, 'src/config')},
            { find: /^@\/components/, replacement: path.resolve(projectRootDir, 'src/components')},
            { find: /^@\/canvas/, replacement: path.resolve(projectRootDir, 'src/canvas') },
            { find: /^@\/canvas-web/, replacement: path.resolve(projectRootDir, 'src/canvas-web') },
            { find: /^@\/views/, replacement: path.resolve(projectRootDir, 'src/views')},
            { find: /^@\/utils/, replacement: path.resolve(projectRootDir, 'src/utils')},
            { find: /^@\/editor-layout/, replacement: path.resolve(projectRootDir, 'src/editor-layout')},
        ],
    },
    plugins: [
        react(),
        // importToCDN({
        //     modules: [
        //         {
        //             name: 'react',
        //             var: 'React',
        //             path: `https://lf26-cdn-tos.bytecdntp.com/cdn/expire-1-M/react/17.0.2/umd/react.production.min.js`,
        //         },
        //         {
        //             name: 'react-dom',
        //             var: 'ReactDOM',
        //             path: `https://lf6-cdn-tos.bytecdntp.com/cdn/expire-1-M/react-dom/17.0.1/umd/react-dom.production.min.js`,
        //         },
        //     ],
        // }),
        // legacy({
        //     targets: ['defaults', 'not IE 11']
        // }),
    ],
    build: {
        // sourcemap: true,
        // rollupOptions: {
        //     // external: [
        //     //     'moment',
        //     //     // 'echarts',
        //     //     // 'react',
        //     //     // 'react-dom'
        //     // ],
        //     // output: {
        //     //     globals: {
        //     //         moment: 'moment',
        //     //         echarts: 'echarts',
        //     //         // 'react': 'React',
        //     //         // 'react-dom': 'ReactDOM'
        //     //     }
        //     // }
        //     plugins: [
        //         // commonjs(),
        //         // externalGlobals({
        //         //     moment: 'window.moment',
        //         //     // echarts: 'window.echarts',
        //         //     // react: 'window.React',
        //         //     // 'react-dom': 'ReactDOM',
        //         // }),
        //     ],
        //     // output: {
        //     //     manualChunks(id) { // 分包
        //     //         if (id.includes('node_modules')) {
        //     //             return id.toString().split('node_modules/')[1].split('/')[0].toString();
        //     //         }
        //     //     }
        //     // }
        // },
    },
})
