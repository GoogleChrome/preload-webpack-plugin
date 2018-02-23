/**
 * @license
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/* eslint-env jasmine */
'use strict';

const path = require('path');
const MemoryFileSystem = require('memory-fs');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const PreloadPlugin = require('../');
const OUTPUT_DIR = path.join(__dirname, 'dist');

describe('PreloadPlugin preloads or prefetches async chunks', function() {
  it('adds preload tags to async chunks', function(done) {
    const compiler = webpack({
      entry: {
        js: path.join(__dirname, 'fixtures', 'file.js')
      },
      output: {
        path: OUTPUT_DIR,
        filename: 'bundle.js',
        chunkFilename: 'chunk.[chunkhash].js',
        publicPath: '/',
      },
      plugins: [
        new HtmlWebpackPlugin(),
        new PreloadPlugin()
      ]
    }, function(err, result) {
      expect(err).toBeFalsy();
      expect(JSON.stringify(result.compilation.errors)).toBe('[]');
      const html = result.compilation.assets['index.html'].source();
      expect(html).toContain('<link rel="preload" as="script" href="/chunk.');
      expect(html).not.toContain('<link rel="preload" as="script" href="/bundle.');
      done();
    });
    compiler.outputFileSystem = new MemoryFileSystem();
  });

  it('adds prefetch tags to async chunks', function(done) {
    const compiler = webpack({
      entry: {
        js: path.join(__dirname, 'fixtures', 'file.js')
      },
      output: {
        path: OUTPUT_DIR,
        filename: 'bundle.js',
        chunkFilename: 'chunk.[chunkhash].js',
        publicPath: '/',
      },
      plugins: [
        new HtmlWebpackPlugin(),
        new PreloadPlugin({
          rel: 'prefetch'
        })
      ]
    }, function(err, result) {
      expect(err).toBeFalsy();
      expect(JSON.stringify(result.compilation.errors)).toBe('[]');
      const html = result.compilation.assets['index.html'].source();
      expect(html).toContain('<link rel="prefetch" href="/chunk.');
      done();
    });
    compiler.outputFileSystem = new MemoryFileSystem();
  });

  it('adds dynamic prefetch tags to async chunks', function(done) {
    const relFunction = function(params) {
      expect(params.filename).toBe('index.html');
      expect(params.entry).toMatch(/^\/chunk\.[0-9a-f]+\.js$/);
      return 'prefetch';
    };
    const compiler = webpack({
      entry: {
        js: path.join(__dirname, 'fixtures', 'file.js')
      },
      output: {
        path: OUTPUT_DIR,
        filename: 'bundle.js',
        chunkFilename: 'chunk.[chunkhash].js',
        publicPath: '/',
      },
      plugins: [
        new HtmlWebpackPlugin(),
        new PreloadPlugin({
          rel: relFunction
        })
      ]
    }, function(err, result) {
      expect(err).toBeFalsy();
      expect(JSON.stringify(result.compilation.errors)).toBe('[]');
      const html = result.compilation.assets['index.html'].source();
      expect(html).toContain('<link rel="prefetch" href="/chunk.');
      done();
    });
    compiler.outputFileSystem = new MemoryFileSystem();
  });

  it('respects publicPath', function(done) {
    const compiler = webpack({
      entry: {
        js: path.join(__dirname, 'fixtures', 'file.js')
      },
      output: {
        path: OUTPUT_DIR,
        filename: 'bundle.js',
        chunkFilename: 'chunk.[chunkhash].js',
        publicPath: 'http://mycdn.com/',
      },
      plugins: [
        new HtmlWebpackPlugin(),
        new PreloadPlugin()
      ]
    }, function(err, result) {
      expect(err).toBeFalsy();
      expect(JSON.stringify(result.compilation.errors)).toBe('[]');
      const html = result.compilation.assets['index.html'].source();
      expect(html).toContain('<link rel="preload" as="script" href="http://mycdn.com/chunk.');
      expect(html).not.toContain('<link rel="preload" as="script" href="http://mycdn.com/bundle.');
      done();
    });
    compiler.outputFileSystem = new MemoryFileSystem();
  });
});

describe('PreloadPlugin preloads normal chunks', function() {
  it('adds preload tags', function(done) {
    const compiler = webpack({
      entry: path.join(__dirname, 'fixtures', 'file.js'),
      output: {
        path: OUTPUT_DIR,
        filename: 'bundle.js',
        chunkFilename: 'chunk.[chunkhash].js',
        publicPath: '/',
      },
      plugins: [
        new HtmlWebpackPlugin(),
        new PreloadPlugin({
          rel: 'preload',
          as: 'script',
          include: 'all'
        })
      ]
    }, function(err, result) {
      expect(err).toBeFalsy();
      expect(JSON.stringify(result.compilation.errors)).toBe('[]');
      const html = result.compilation.assets['index.html'].source();
      expect(html).toContain('<link rel="preload" as="script" href="/chunk');
      expect(html).toContain('<link rel="preload" as="script" href="/bundle.js"');
      done();
    });
    compiler.outputFileSystem = new MemoryFileSystem();
  });

  it('adds preload using "style" for css and "script" for others', (done) => {
    const compiler = webpack({
      entry: {
        js: path.join(__dirname, 'fixtures', 'file.js')
      },
      output: {
        path: OUTPUT_DIR,
        filename: 'bundle.js',
        chunkFilename: 'chunk.[chunkhash].css',
        publicPath: '/',
      },
      plugins: [
        new HtmlWebpackPlugin(),
        new PreloadPlugin({
          rel: 'preload',
          include: 'all'
        })
      ]
    }, function(err, result) {
      expect(err).toBeFalsy();
      expect(JSON.stringify(result.compilation.errors)).toBe('[]');
      const html = result.compilation.assets['index.html'].source();
      expect(html).toContain('<link rel="preload" as="style" href="/chunk');
      expect(html).toContain('<link rel="preload" as="script" href="/bundle.js"');
      done();
    });
    compiler.outputFileSystem = new MemoryFileSystem();
  });

  it('force value of "as" attribute when provided in option', (done) => {
    const compiler = webpack({
      entry: path.join(__dirname, 'fixtures', 'file.js'),
      output: {
        path: OUTPUT_DIR,
        filename: 'bundle.js',
        chunkFilename: 'chunk.[chunkhash].css',
        publicPath: '/',
      },
      plugins: [
        new HtmlWebpackPlugin(),
        new PreloadPlugin({
          rel: 'preload',
          as: 'script',
          include: 'all'
        })
      ]
    }, function(err, result) {
      expect(err).toBeFalsy();
      expect(JSON.stringify(result.compilation.errors)).toBe('[]');
      const html = result.compilation.assets['index.html'].source();
      expect(html).toContain('<link rel="preload" as="script" href="/chunk');
      expect(html).toContain('<link rel="preload" as="script" href="/bundle.js"');
      done();
    });
    compiler.outputFileSystem = new MemoryFileSystem();
  });

  it('adds preload using "font" for fonts and add crossorigin attribute', (done) => {
    const compiler = webpack({
      entry: {
        js: path.join(__dirname, 'fixtures', 'file.js')
      },
      output: {
        path: OUTPUT_DIR,
        filename: 'bundle.js',
        chunkFilename: 'chunk.[chunkhash].woff2',
        publicPath: '/',
      },
      plugins: [
        new HtmlWebpackPlugin(),
        new PreloadPlugin({
          rel: 'preload',
          include: 'all'
        })
      ]
    }, function(err, result) {
      expect(err).toBeFalsy();
      expect(JSON.stringify(result.compilation.errors)).toBe('[]');
      const html = result.compilation.assets['index.html'].source();
      expect(html).toContain('<link rel="preload" as="font" crossorigin="crossorigin" href="/chunk');
      expect(html).toContain('<link rel="preload" as="script" href="/bundle.js"');
      done();
    });
    compiler.outputFileSystem = new MemoryFileSystem();
  });

  it('use custom as attribute based on return value of callback', (done) => {
    const compiler = webpack({
      entry: path.join(__dirname, 'fixtures', 'file.js'),
      output: {
        path: OUTPUT_DIR,
        filename: 'bundle.js',
        chunkFilename: 'chunk.[chunkhash].css',
        publicPath: '/',
      },
      plugins: [
        new HtmlWebpackPlugin(),
        new PreloadPlugin({
          rel: 'preload',
          as(entry) {
            if (entry.indexOf('/chunk') === 0) return 'style';
            return 'script';
          },
          include: 'all',
        }),
      ],
    }, function(err, result) {
      expect(err).toBeFalsy();
      expect(JSON.stringify(result.compilation.errors)).toBe('[]');
      const html = result.compilation.assets['index.html'].source();
      expect(html).toContain('<link rel="preload" as="style" href="/chunk');
      expect(html).toContain('<link rel="preload" as="script" href="/bundle.js"');
      done();
    });
    compiler.outputFileSystem = new MemoryFileSystem();
  });
});

describe('PreloadPlugin prefetches normal chunks', function() {
  it('adds prefetch tags', function(done) {
    const compiler = webpack({
      entry: path.join(__dirname, 'fixtures', 'file.js'),
      output: {
        path: OUTPUT_DIR
      },
      plugins: [
        new HtmlWebpackPlugin(),
        new PreloadPlugin({
          rel: 'prefetch',
          include: 'all'
        })
      ]
    }, function(err, result) {
      expect(err).toBeFalsy();
      expect(JSON.stringify(result.compilation.errors)).toBe('[]');
      const html = result.compilation.assets['index.html'].source();
      expect(html).toContain('<link rel="prefetch" href="0');
      expect(html).toContain('<link rel="prefetch" href="main.js"');
      done();
    });
    compiler.outputFileSystem = new MemoryFileSystem();
  });
});

describe('PreloadPlugin dynamically preloads/prefetches normal chunks', function() {
  it('adds prefetch tags', function(done) {
    const relFunction = function(params) {
      expect(params.filename).toBe('index.html');
      expect(params.entry).toMatch(/0\.js|main\.js/);
      return 'prefetch';
    };
    const compiler = webpack({
      entry: path.join(__dirname, 'fixtures', 'file.js'),
      output: {
        path: OUTPUT_DIR
      },
      plugins: [
        new HtmlWebpackPlugin(),
        new PreloadPlugin({
          rel: relFunction,
          include: 'all'
        })
      ]
    }, function(err, result) {
      expect(err).toBeFalsy();
      expect(JSON.stringify(result.compilation.errors)).toBe('[]');
      const html = result.compilation.assets['index.html'].source();
      expect(html).toContain('<link rel="prefetch" href="0');
      expect(html).toContain('<link rel="prefetch" href="main.js"');
      done();
    });
    compiler.outputFileSystem = new MemoryFileSystem();
  });
});

describe('PreloadPlugin filters chunks', function() {
  it('based on chunkname', function(done) {
    const compiler = webpack({
      entry: path.join(__dirname, 'fixtures', 'file.js'),
      output: {
        path: OUTPUT_DIR,
        filename: 'bundle.js',
        chunkFilename: '[name].[chunkhash].js',
        publicPath: '/',
      },
      plugins: [
        new HtmlWebpackPlugin(),
        new PreloadPlugin({
          rel: 'preload',
          as: 'script',
          include: ['home']
        })
      ]
    }, function(err, result) {
      expect(err).toBeFalsy();
      expect(JSON.stringify(result.compilation.errors)).toBe('[]');
      const html = result.compilation.assets['index.html'].source();
      expect(html).toContain('<link rel="preload" as="script" href="/home');
      expect(html).not.toContain('<link rel="preload" as="script" href="/bundle.js"');
      done();
    });
    compiler.outputFileSystem = new MemoryFileSystem();
  });
  it('based on chunkname with sourcemap', function(done) {
    const compiler = webpack({
      entry: path.join(__dirname, 'fixtures', 'file.js'),
      devtool: 'cheap-source-map',
      output: {
        path: OUTPUT_DIR,
        filename: 'bundle.js',
        chunkFilename: '[name].js',
        publicPath: '/',
      },
      plugins: [
        new HtmlWebpackPlugin(),
        new PreloadPlugin({
          rel: 'preload',
          as: 'script',
          include: ['home'],
          // disable default file blacklist, to include map file
          fileBlacklist: [],
        })
      ]
    }, function(err, result) {
      expect(err).toBeFalsy();
      expect(JSON.stringify(result.compilation.errors)).toBe('[]');
      const html = result.compilation.assets['index.html'].source();
      expect(html).toContain('<link rel="preload" as="script" href="/home.js');
      expect(html).toContain('<link rel="preload" as="script" href="/home.js.map');
      expect(html).not.toContain('<link rel="preload" as="script" href="/bundle.js"');
      done();
    });
    compiler.outputFileSystem = new MemoryFileSystem();
  });
});

describe('filtering unwanted files', function() {
  it('does not include map files to be preloaded', function(done) {
    const compiler = webpack({
      entry: {
        js: path.join(__dirname, 'fixtures', 'file.js')
      },
      output: {
        path: OUTPUT_DIR,
        filename: 'bundle.js',
        chunkFilename: 'chunk.[chunkhash].js',
        publicPath: '/',
      },
      devtool: 'cheap-source-map',
      plugins: [
        new HtmlWebpackPlugin(),
        new PreloadPlugin()
      ]
    }, function(err, result) {
      expect(err).toBeFalsy();
      expect(JSON.stringify(result.compilation.errors)).toBe('[]');
      const html = result.compilation.assets['index.html'].source();
      expect(html).toContain('<link rel="preload" as="script" href="/chunk.');
      expect(html).not.toContain('.map"');
      done();
    });
    compiler.outputFileSystem = new MemoryFileSystem();
  });
});

describe('multiple html', function() {
  it('each one only include their own chunk', function(done) {
    const compiler = webpack({
      entry: {
        js: path.join(__dirname, 'fixtures', 'file.js'),
        moduleA: path.join(__dirname, 'fixtures', 'module-a.js')
      },
      output: {
        path: OUTPUT_DIR,
        filename: '[name].js',
        chunkFilename: 'chunk.[chunkhash].js',
        publicPath: '/',
      },
      devtool: 'cheap-source-map',
      plugins: [
        new HtmlWebpackPlugin({
          filename: 'index.html',
          chunks: ['js'],
        }),
        new HtmlWebpackPlugin({
          filename: 'home.html',
          chunks: ['moduleA'],
        }),
        new PreloadPlugin()
      ]
    }, function(err, result) {
      expect(err).toBeFalsy();
      expect(JSON.stringify(result.compilation.errors)).toBe('[]');
      const html = result.compilation.assets['index.html'].source();
      const homeHtml = result.compilation.assets['home.html'].source();
      expect(html).toContain('<link rel="preload" as="script" href="/chunk.');
      expect(homeHtml).not.toContain('<link rel="preload" as="script" href="/chunk.');
      done();
    });
    compiler.outputFileSystem = new MemoryFileSystem();
  });

  it('exclude by html filename', function(done) {
    const compiler = webpack({
      entry: {
        js: path.join(__dirname, 'fixtures', 'file.js')
      },
      output: {
        path: OUTPUT_DIR,
        filename: '[name].js',
        chunkFilename: 'chunk.[chunkhash].js',
        publicPath: '/',
      },
      devtool: 'cheap-source-map',
      plugins: [
        new HtmlWebpackPlugin({
          filename: 'index.html',
          chunks: ['js'],
        }),
        new HtmlWebpackPlugin({
          filename: 'home.html',
          chunks: ['js'],
        }),
        new PreloadPlugin({
          excludeHtmlNames: ['index.html'],
        })
      ]
    }, function(err, result) {
      expect(err).toBeFalsy();
      expect(JSON.stringify(result.compilation.errors)).toBe('[]');
      const html = result.compilation.assets['index.html'].source();
      const homeHtml = result.compilation.assets['home.html'].source();
      expect(html).not.toContain('<link rel="preload" as="script" href="/chunk.');
      expect(homeHtml).toContain('<link rel="preload" as="script" href="/chunk.');
      done();
    });
    compiler.outputFileSystem = new MemoryFileSystem();
  });
});

describe('filtering unwanted html', function() {
  it('does not include preload asset into index.html file', function(done) {
    const compiler = webpack({
      entry: {
        js: path.join(__dirname, 'fixtures', 'file.js')
      },
      output: {
        path: OUTPUT_DIR,
        filename: 'bundle.js',
        chunkFilename: 'chunk.[chunkhash].js',
        publicPath: '/',
      },
      devtool: 'cheap-source-map',
      plugins: [
        new HtmlWebpackPlugin(),
        new PreloadPlugin({
          excludeHtmlNames: ['index.html'],
        })
      ]
    }, function(err, result) {
      expect(err).toBeFalsy();
      expect(JSON.stringify(result.compilation.errors)).toBe('[]');
      const html = result.compilation.assets['index.html'].source();
      expect(html).not.toContain('<link rel="preload" as="script" href="/chunk.');
      done();
    });
    compiler.outputFileSystem = new MemoryFileSystem();
  });
});
