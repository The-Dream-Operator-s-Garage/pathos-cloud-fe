<template>
  <q-page class="mercury-playground q-pa-lg">
    <!-- ── Frieze header — thin full-bleed strip at the very top. Two
         imported SVG masks stack as independently-colored layers
         repeating side-to-side; the strip surface is a metallic sheen
         over a chooseable base color. Negative margins bleed through
         the page padding so the frieze touches the screen edges. -->
    <div class="mercury-frieze-header" :style="friezeHeaderStyle">
      <div class="mercury-frieze-inner">
        <div class="mercury-frieze-layer" :style="friezeLayerStyle('one')" />
        <div class="mercury-frieze-layer" :style="friezeLayerStyle('two')" />
        <div v-if="!friezeLayers.one.url && !friezeLayers.two.url" class="mercury-frieze-empty nasalization">
          frieze header — import two svgs below or pull the board waves
        </div>
      </div>
      <!-- glass overlayer — tinted translucent sheet with a glassy edge,
           spanning the FULL header height (over the friezes AND the padded
           metal margins), not just the padded frieze area -->
      <div class="mercury-frieze-glass" :style="glassStyle" />
    </div>

    <div class="row items-center q-mb-md">
      <div class="nasalization text-h5 mercury-title">Mercury Playground</div>
      <q-space />
      <div class="text-caption mercury-sub">ServiceConsole palette — gradient &amp; background lab</div>
    </div>

    <!-- Frieze header controls — svg play -->
    <div class="mercury-card q-pa-md q-mb-lg">
      <div class="mercury-card-title">Frieze header — svg play</div>
      <div class="mercury-stop-row q-mb-sm">
        <q-file
          v-model="friezeFiles.one"
          dense dark filled label="svg layer 1"
          accept=".svg,image/svg+xml"
          class="mercury-file"
          @update:model-value="f => onFriezeFile('one', f)"
        />
        <q-file
          v-model="friezeFiles.two"
          dense dark filled label="svg layer 2"
          accept=".svg,image/svg+xml"
          class="mercury-file"
          @update:model-value="f => onFriezeFile('two', f)"
        />
        <q-btn unelevated dense no-caps color="cyan-3" text-color="black" label="use board waves" @click="friezeFromBoard" />
      </div>
      <div class="mercury-stop-row q-mb-sm">
        <span class="mercury-layer-name">layer 1</span>
        <div class="mercury-swatch" :style="{ background: friezeLayers.one.color }">
          <q-menu dark class="mercury-menu">
            <div class="q-pa-sm">
              <div v-for="group in palette" :key="group.name" class="mercury-palette-group">
                <div class="mercury-palette-name">{{ group.name }}</div>
                <div class="row no-wrap">
                  <div
                    v-for="c in group.colors" :key="c.name"
                    v-close-popup
                    class="mercury-chip"
                    :style="{ background: c.hex }"
                    @click="friezeLayers.one.color = c.hex"
                  >
                    <q-tooltip>{{ c.name }} {{ c.hex }}</q-tooltip>
                  </div>
                </div>
              </div>
            </div>
          </q-menu>
        </div>
        <q-input v-model="friezeLayers.one.color" dense dark borderless class="mercury-hex-input" />
        <span class="mercury-layer-name">layer 2</span>
        <div class="mercury-swatch" :style="{ background: friezeLayers.two.color }">
          <q-menu dark class="mercury-menu">
            <div class="q-pa-sm">
              <div v-for="group in palette" :key="group.name" class="mercury-palette-group">
                <div class="mercury-palette-name">{{ group.name }}</div>
                <div class="row no-wrap">
                  <div
                    v-for="c in group.colors" :key="c.name"
                    v-close-popup
                    class="mercury-chip"
                    :style="{ background: c.hex }"
                    @click="friezeLayers.two.color = c.hex"
                  >
                    <q-tooltip>{{ c.name }} {{ c.hex }}</q-tooltip>
                  </div>
                </div>
              </div>
            </div>
          </q-menu>
        </div>
        <q-input v-model="friezeLayers.two.color" dense dark borderless class="mercury-hex-input" />
        <span class="mercury-layer-name">metal</span>
        <div class="mercury-swatch" :style="{ background: frieze.bg }">
          <q-menu dark class="mercury-menu">
            <div class="q-pa-sm">
              <div v-for="group in palette" :key="group.name" class="mercury-palette-group">
                <div class="mercury-palette-name">{{ group.name }}</div>
                <div class="row no-wrap">
                  <div
                    v-for="c in group.colors" :key="c.name"
                    v-close-popup
                    class="mercury-chip"
                    :style="{ background: c.hex }"
                    @click="frieze.bg = c.hex"
                  >
                    <q-tooltip>{{ c.name }} {{ c.hex }}</q-tooltip>
                  </div>
                </div>
              </div>
            </div>
          </q-menu>
        </div>
        <q-input v-model="frieze.bg" dense dark borderless class="mercury-hex-input" />
      </div>
      <div class="row q-col-gutter-md q-mb-sm">
        <div class="col-4 mercury-slider-row">
          <span class="mercury-slider-label">height {{ frieze.height }}px</span>
          <q-slider v-model="frieze.height" :min="20" :max="120" dense color="cyan-3" class="col" />
        </div>
        <div class="col-4 mercury-slider-row">
          <span class="mercury-slider-label">frieze size {{ frieze.scale }}%</span>
          <q-slider v-model="frieze.scale" :min="15" :max="100" dense color="cyan-3" class="col" />
        </div>
        <div class="col-4 mercury-slider-row">
          <span class="mercury-slider-label">padding {{ frieze.pad }}px</span>
          <q-slider v-model="frieze.pad" :min="0" :max="24" dense color="cyan-3" class="col" />
        </div>
      </div>

      <!-- Glass overlayer — colour, opacity, and a glassy edge -->
      <div class="mercury-stop-row q-mb-sm">
        <span class="mercury-layer-name">glass</span>
        <div class="mercury-swatch" :style="{ background: glass.color }">
          <q-menu dark class="mercury-menu">
            <div class="q-pa-sm">
              <div v-for="group in palette" :key="group.name" class="mercury-palette-group">
                <div class="mercury-palette-name">{{ group.name }}</div>
                <div class="row no-wrap">
                  <div
                    v-for="c in group.colors" :key="c.name"
                    v-close-popup
                    class="mercury-chip"
                    :style="{ background: c.hex }"
                    @click="glass.color = c.hex"
                  >
                    <q-tooltip>{{ c.name }} {{ c.hex }}</q-tooltip>
                  </div>
                </div>
              </div>
            </div>
          </q-menu>
        </div>
        <q-input v-model="glass.color" dense dark borderless class="mercury-hex-input" />
        <span class="mercury-slider-label mercury-tight">opacity {{ glass.opacity }}</span>
        <q-slider v-model="glass.opacity" :min="0" :max="0.85" :step="0.02" dense color="cyan-3" class="col" />
        <q-toggle v-model="glass.border" dense dark color="cyan-3" label="glass edge" class="mercury-toggle-label" />
      </div>

      <!-- Carve — strategic drop-shadows on the frieze silhouettes so the
           motif reads as needle-carved into the glass-metallic plaque -->
      <div class="mercury-stop-row">
        <span class="mercury-layer-name">carve</span>
        <span class="mercury-slider-label mercury-tight">depth {{ carve.depth }}px</span>
        <q-slider v-model="carve.depth" :min="0" :max="5" :step="0.5" dense color="cyan-3" class="col" />
        <span class="mercury-layer-name mercury-tight">light</span>
        <div class="mercury-swatch" :style="{ background: carve.light }">
          <q-menu dark class="mercury-menu">
            <div class="q-pa-sm">
              <div v-for="group in palette" :key="group.name" class="mercury-palette-group">
                <div class="mercury-palette-name">{{ group.name }}</div>
                <div class="row no-wrap">
                  <div
                    v-for="c in group.colors" :key="c.name"
                    v-close-popup
                    class="mercury-chip"
                    :style="{ background: c.hex }"
                    @click="carve.light = c.hex"
                  >
                    <q-tooltip>{{ c.name }} {{ c.hex }}</q-tooltip>
                  </div>
                </div>
              </div>
            </div>
          </q-menu>
        </div>
        <q-input v-model="carve.light" dense dark borderless class="mercury-hex-input" />
        <span class="mercury-layer-name mercury-tight">shadow</span>
        <div class="mercury-swatch" :style="{ background: carve.dark }">
          <q-menu dark class="mercury-menu">
            <div class="q-pa-sm">
              <div v-for="group in palette" :key="group.name" class="mercury-palette-group">
                <div class="mercury-palette-name">{{ group.name }}</div>
                <div class="row no-wrap">
                  <div
                    v-for="c in group.colors" :key="c.name"
                    v-close-popup
                    class="mercury-chip"
                    :style="{ background: c.hex }"
                    @click="carve.dark = c.hex"
                  >
                    <q-tooltip>{{ c.name }} {{ c.hex }}</q-tooltip>
                  </div>
                </div>
              </div>
            </div>
          </q-menu>
        </div>
        <q-input v-model="carve.dark" dense dark borderless class="mercury-hex-input" />
      </div>
    </div>

    <!-- Tile board — single-layer two-color drawing strip, the page's
         default lab. The middle tile is the master; left/right
         repetitions render from the same map (col % cols) so any
         stroke shows up in all three, including across a seam. -->
    <div class="mercury-card q-pa-md q-mb-lg">
      <div class="row items-center q-mb-sm">
        <div class="mercury-card-title q-mb-none">Tile board</div>
        <q-space />
        <q-toggle v-model="board.on" dense dark color="cyan-3" label="tile board" class="mercury-toggle-label q-mr-md" />
        <q-btn v-if="board.on" flat dense no-caps size="sm" color="grey-5" label="clear" @click="clearBoard" />
      </div>

      <template v-if="board.on">
        <div class="row q-col-gutter-md">
          <div class="col-6 col-sm-3 mercury-slider-row">
            <span class="mercury-slider-label">tile length {{ board.cols }}px</span>
            <q-slider v-model="board.cols" :min="4" :max="40" dense color="cyan-3" class="col" />
          </div>
          <div class="col-6 col-sm-3 mercury-slider-row">
            <span class="mercury-slider-label">tile height {{ board.rows }}px</span>
            <q-slider v-model="board.rows" :min="4" :max="32" dense color="cyan-3" class="col" />
          </div>
          <div class="col-6 col-sm-3 mercury-slider-row">
            <span class="mercury-slider-label">size {{ board.size }}</span>
            <q-slider v-model="board.size" :min="6" :max="24" dense color="cyan-3" class="col" />
          </div>
          <div class="col-6 col-sm-3 mercury-slider-row">
            <span class="mercury-slider-label">radius {{ board.radius }}%</span>
            <q-slider v-model="board.radius" :min="0" :max="50" dense color="cyan-3" class="col" />
          </div>
        </div>

        <div class="mercury-stop-row q-mt-sm">
          <q-btn-toggle
            v-model="boardPaint"
            dense unelevated no-caps
            toggle-color="cyan-3" toggle-text-color="black" text-color="grey-5"
            class="mercury-toggle"
            :options="[
              { label: 'wave A', value: 'a' },
              { label: 'wave B', value: 'b' },
              { label: 'erase', value: 'erase' }
            ]"
          />
          <div class="mercury-swatch" :style="{ background: boardColors.a }">
            <q-menu dark class="mercury-menu">
              <div class="q-pa-sm">
                <div v-for="group in palette" :key="group.name" class="mercury-palette-group">
                  <div class="mercury-palette-name">{{ group.name }}</div>
                  <div class="row no-wrap">
                    <div
                      v-for="c in group.colors" :key="c.name"
                      v-close-popup
                      class="mercury-chip"
                      :style="{ background: c.hex }"
                      @click="boardColors.a = c.hex"
                    >
                      <q-tooltip>{{ c.name }} {{ c.hex }}</q-tooltip>
                    </div>
                  </div>
                </div>
              </div>
            </q-menu>
          </div>
          <q-input v-model="boardColors.a" dense dark borderless class="mercury-hex-input" />
          <div class="mercury-swatch" :style="{ background: boardColors.b }">
            <q-menu dark class="mercury-menu">
              <div class="q-pa-sm">
                <div v-for="group in palette" :key="group.name" class="mercury-palette-group">
                  <div class="mercury-palette-name">{{ group.name }}</div>
                  <div class="row no-wrap">
                    <div
                      v-for="c in group.colors" :key="c.name"
                      v-close-popup
                      class="mercury-chip"
                      :style="{ background: c.hex }"
                      @click="boardColors.b = c.hex"
                    >
                      <q-tooltip>{{ c.name }} {{ c.hex }}</q-tooltip>
                    </div>
                  </div>
                </div>
              </div>
            </q-menu>
          </div>
          <q-input v-model="boardColors.b" dense dark borderless class="mercury-hex-input" />
        </div>

        <div class="mercury-canvas mercury-board-canvas">
          <div class="mercury-board-wrap">
            <div
              class="mercury-board"
              :style="boardStyle"
              @mouseup="painting = false"
              @mouseleave="painting = false"
            >
              <template v-for="r in board.rows" :key="r">
                <div
                  v-for="c in board.cols * 3" :key="r + '-' + c"
                  class="mercury-board-cell"
                  :style="{
                    width: board.size + 'px',
                    height: board.size + 'px',
                    borderRadius: (board.size * board.radius / 100) + 'px',
                    background: boardCellColor(r, c)
                  }"
                  @mousedown.prevent="startPaint(r, c)"
                  @mouseover="dragPaint(r, c)"
                />
              </template>
            </div>
            <div class="mercury-seam" :style="seamStyle(1)" />
            <div class="mercury-seam" :style="seamStyle(2)" />
          </div>
          <div class="mercury-board-hint">middle tile between the guides — sides are its live repetitions (drag to paint, strokes wrap across seams)</div>
        </div>

        <q-separator dark spaced />

        <div class="mercury-card-title">Export / interpret</div>
        <div class="mercury-stop-row q-mb-sm">
          <q-btn
            unelevated dense no-caps
            color="cyan-3" text-color="black"
            label="save — copy tile as text"
            @click="exportBoard"
          />
          <q-btn
            outline dense no-caps
            color="cyan-3"
            label="interpret"
            @click="interpretBoard"
          />
          <q-btn
            outline dense no-caps
            :style="{ color: boardColors.a }" icon-right="download"
            label="svg A"
            @click="downloadSvg('a')"
          />
          <q-btn
            outline dense no-caps
            :style="{ color: boardColors.b }" icon-right="download"
            label="svg B"
            @click="downloadSvg('b')"
          />
          <q-btn
            outline dense no-caps
            color="cyan-3" icon-right="download"
            label="svg both"
            @click="downloadSvg()"
          />
          <span class="mercury-io-status">{{ boardIOStatus }}</span>
        </div>
        <q-input
          v-model="boardIO"
          type="textarea"
          dark filled dense
          class="mercury-io"
          rows="8"
          placeholder="MERCURY-TILE v1
cols: 20
rows: 22
size: 12
radius: 15
a: #00e0ff
b: #ff99fe
map:
..aab...
(paste a saved tile here, then hit interpret)"
        />
      </template>
    </div>

    <div class="row q-col-gutter-lg">
      <!-- ── Builder column ─────────────────────────────────────────── -->
      <div class="col-12 col-md-4">
        <div class="mercury-card q-pa-md">
          <div class="mercury-card-title">Gradient builder</div>

          <q-btn-toggle
            v-model="type"
            spread unelevated dense
            toggle-color="cyan-3"
            toggle-text-color="black"
            text-color="grey-5"
            class="mercury-toggle q-mb-md"
            :options="[
              { label: 'radial', value: 'radial' },
              { label: 'linear', value: 'linear' }
            ]"
          />

          <template v-if="type === 'radial'">
            <div class="mercury-slider-row">
              <span class="mercury-slider-label">at X {{ posX }}%</span>
              <q-slider v-model="posX" :min="-100" :max="500" dense color="cyan-3" />
            </div>
            <div class="mercury-slider-row">
              <span class="mercury-slider-label">at Y {{ posY }}%</span>
              <q-slider v-model="posY" :min="-100" :max="500" dense color="cyan-3" />
            </div>
          </template>
          <template v-else>
            <div class="mercury-slider-row">
              <span class="mercury-slider-label">{{ angle }}deg</span>
              <q-slider v-model="angle" :min="0" :max="360" dense color="cyan-3" />
            </div>
          </template>

          <q-separator dark spaced />

          <div class="mercury-card-title">Stops</div>
          <div v-for="(stop, i) in stops" :key="i" class="mercury-stop-row">
            <div class="mercury-swatch" :style="{ background: stop.color }">
              <q-menu dark class="mercury-menu">
                <div class="q-pa-sm">
                  <div v-for="group in palette" :key="group.name" class="mercury-palette-group">
                    <div class="mercury-palette-name">{{ group.name }}</div>
                    <div class="row no-wrap">
                      <div
                        v-for="c in group.colors" :key="c.name"
                        v-close-popup
                        class="mercury-chip"
                        :style="{ background: c.hex }"
                        @click="stop.color = c.hex"
                      >
                        <q-tooltip>{{ c.name }} {{ c.hex }}</q-tooltip>
                      </div>
                    </div>
                  </div>
                </div>
              </q-menu>
            </div>
            <q-input
              v-model="stop.color"
              dense dark borderless
              class="mercury-hex-input"
            />
            <q-slider v-model="stop.pct" :min="-50" :max="200" dense color="cyan-3" class="col" />
            <span class="mercury-slider-label mercury-pct">{{ stop.pct }}%</span>
            <q-btn
              flat dense round size="sm" icon="close" color="grey-6"
              :disable="stops.length <= 2"
              @click="removeStop(i)"
            />
          </div>

          <q-separator dark spaced />

          <div class="mercury-card-title">Palette — click to add a stop</div>
          <div v-for="group in palette" :key="group.name" class="mercury-palette-group">
            <div class="mercury-palette-name">{{ group.name }}</div>
            <div class="row no-wrap">
              <div
                v-for="c in group.colors" :key="c.name"
                class="mercury-chip"
                :style="{ background: c.hex }"
                @click="addStop(c.hex)"
              >
                <q-tooltip>{{ c.name }} {{ c.hex }}</q-tooltip>
              </div>
            </div>
          </div>

          <q-separator dark spaced />

          <div class="mercury-card-title">CSS</div>
          <pre class="mercury-css">background: {{ gradientCss }};</pre>
          <q-btn
            unelevated dense no-caps
            class="full-width"
            color="cyan-3" text-color="black"
            :label="copied ? 'copied!' : 'copy css'"
            @click="copyCss"
          />
        </div>
      </div>

      <!-- ── Preview column ─────────────────────────────────────────── -->
      <div class="col-12 col-md-8">
        <!-- Pixel grid lab — every "pixel" is a 3-layer stack (shadow /
             main / glass). Global panel drives all pixels at once; the
             mini grid below the big one edits single pixels (off /
             per-layer color overrides). Designed so a later pass can
             paint ONE background across the whole grid instead of
             per-pixel colors. Unmounted while the tile board is on. -->
        <div v-if="!board.on" class="mercury-card q-pa-md q-mb-lg">
          <div class="row items-center q-mb-sm">
            <div class="mercury-card-title q-mb-none">Pixel grid</div>
            <q-space />
            <q-toggle
              :model-value="pattern"
              dense dark color="cyan-3" label="wave frieze"
              class="mercury-toggle-label q-mr-md"
              @update:model-value="toggleWave"
            />
            <q-btn flat dense no-caps size="sm" color="grey-5" label="reset pixels" @click="clearOverrides" />
          </div>

          <!-- dimensions -->
          <div class="row q-col-gutter-md">
            <div class="col-6 col-sm-3 mercury-slider-row">
              <span class="mercury-slider-label">length {{ grid.cols }}px</span>
              <q-slider v-model="grid.cols" :min="pattern ? 20 : 1" :max="80" :step="pattern ? 20 : 1" dense color="cyan-3" class="col" />
            </div>
            <div class="col-6 col-sm-3 mercury-slider-row">
              <span class="mercury-slider-label">height {{ grid.rows }}px</span>
              <q-slider v-model="grid.rows" :min="pattern ? 22 : 1" :max="44" :step="pattern ? 22 : 1" dense color="cyan-3" class="col" />
            </div>
            <div class="col-6 col-sm-3 mercury-slider-row">
              <span class="mercury-slider-label">size {{ grid.size }}</span>
              <q-slider v-model="grid.size" :min="8" :max="72" dense color="cyan-3" class="col" />
            </div>
            <div class="col-6 col-sm-3 mercury-slider-row">
              <span class="mercury-slider-label">gap {{ grid.gap }}</span>
              <q-slider v-model="grid.gap" :min="0" :max="16" dense color="cyan-3" class="col" />
            </div>
          </div>

          <q-separator dark spaced />

          <!-- wave frieze colorways — the two alternating motif colors -->
          <div v-if="pattern" class="mercury-stop-row q-mb-sm">
            <span class="mercury-layer-name">wave A</span>
            <div class="mercury-swatch" :style="{ background: patternColors.a }">
              <q-menu dark class="mercury-menu">
                <div class="q-pa-sm">
                  <div v-for="group in palette" :key="group.name" class="mercury-palette-group">
                    <div class="mercury-palette-name">{{ group.name }}</div>
                    <div class="row no-wrap">
                      <div
                        v-for="c in group.colors" :key="c.name"
                        v-close-popup
                        class="mercury-chip"
                        :style="{ background: c.hex }"
                        @click="patternColors.a = c.hex"
                      >
                        <q-tooltip>{{ c.name }} {{ c.hex }}</q-tooltip>
                      </div>
                    </div>
                  </div>
                </div>
              </q-menu>
            </div>
            <q-input v-model="patternColors.a" dense dark borderless class="mercury-hex-input" />
            <span class="mercury-layer-name">wave B</span>
            <div class="mercury-swatch" :style="{ background: patternColors.b }">
              <q-menu dark class="mercury-menu">
                <div class="q-pa-sm">
                  <div v-for="group in palette" :key="group.name" class="mercury-palette-group">
                    <div class="mercury-palette-name">{{ group.name }}</div>
                    <div class="row no-wrap">
                      <div
                        v-for="c in group.colors" :key="c.name"
                        v-close-popup
                        class="mercury-chip"
                        :style="{ background: c.hex }"
                        @click="patternColors.b = c.hex"
                      >
                        <q-tooltip>{{ c.name }} {{ c.hex }}</q-tooltip>
                      </div>
                    </div>
                  </div>
                </div>
              </q-menu>
            </div>
            <q-input v-model="patternColors.b" dense dark borderless class="mercury-hex-input" />
          </div>

          <!-- the 3 pixel layers, controlled for ALL pixels at once -->
          <div class="mercury-card-title">Pixel layers — all pixels</div>
          <div v-for="ln in layerNames" :key="ln">
            <div class="mercury-stop-row">
              <span class="mercury-layer-name">{{ ln }}</span>
              <div class="mercury-swatch" :style="{ background: layers[ln].color }">
                <q-menu dark class="mercury-menu">
                  <div class="q-pa-sm">
                    <div v-for="group in palette" :key="group.name" class="mercury-palette-group">
                      <div class="mercury-palette-name">{{ group.name }}</div>
                      <div class="row no-wrap">
                        <div
                          v-for="c in group.colors" :key="c.name"
                          v-close-popup
                          class="mercury-chip"
                          :style="{ background: c.hex }"
                          @click="layers[ln].color = c.hex"
                        >
                          <q-tooltip>{{ c.name }} {{ c.hex }}</q-tooltip>
                        </div>
                      </div>
                    </div>
                  </div>
                </q-menu>
              </div>
              <q-input v-model="layers[ln].color" dense dark borderless class="mercury-hex-input" />
              <span class="mercury-slider-label mercury-tight">alpha {{ layers[ln].opacity }}</span>
              <q-slider v-model="layers[ln].opacity" :min="0" :max="1" :step="0.05" dense color="cyan-3" class="col" />
              <span class="mercury-slider-label mercury-tight">radius {{ layers[ln].radius }}%</span>
              <q-slider v-model="layers[ln].radius" :min="0" :max="50" dense color="cyan-3" class="col" />
            </div>
            <div v-if="ln === 'shadow'" class="mercury-stop-row mercury-sub-row">
              <span class="mercury-slider-label mercury-tight">offset x {{ layers.shadow.dx }}</span>
              <q-slider v-model="layers.shadow.dx" :min="-8" :max="8" dense color="cyan-3" class="col" />
              <span class="mercury-slider-label mercury-tight">offset y {{ layers.shadow.dy }}</span>
              <q-slider v-model="layers.shadow.dy" :min="-8" :max="8" dense color="cyan-3" class="col" />
            </div>
            <div v-if="ln === 'glass'" class="mercury-stop-row mercury-sub-row">
              <span class="mercury-slider-label mercury-tight">blur {{ layers.glass.blur }}px</span>
              <q-slider v-model="layers.glass.blur" :min="0" :max="10" :step="0.5" dense color="cyan-3" class="col" />
            </div>
          </div>

          <q-separator dark spaced />

          <!-- the grid itself -->
          <div class="mercury-canvas" :style="{ background: canvas }">
            <div class="mercury-pixel-grid" :style="gridStyle">
              <template v-for="r in grid.rows" :key="r">
                <div
                  v-for="c in grid.cols" :key="r + '-' + c"
                  class="mercury-pixel"
                  :style="{ width: grid.size + 'px', height: grid.size + 'px' }"
                  @click="hitPixel(r, c)"
                >
                  <template v-if="!isOff(r, c)">
                    <div class="mercury-pixel-layer" :style="layerStyle('shadow', r, c)" />
                    <div class="mercury-pixel-layer" :style="layerStyle('main', r, c)" />
                    <div class="mercury-pixel-layer" :style="layerStyle('glass', r, c)" />
                  </template>
                </div>
              </template>
            </div>
          </div>

          <!-- per-pixel control grid -->
          <div class="row items-center q-mt-md q-mb-sm">
            <div class="mercury-card-title q-mb-none">Pixel control grid</div>
            <q-space />
            <q-btn-toggle
              v-model="tool"
              dense unelevated no-caps
              toggle-color="cyan-3" toggle-text-color="black" text-color="grey-5"
              class="mercury-toggle"
              :options="[
                { label: 'on / off', value: 'off' },
                { label: 'edit pixel', value: 'edit' }
              ]"
            />
          </div>
          <div class="mercury-mini-grid" :style="miniGridStyle">
            <template v-for="r in grid.rows" :key="r">
              <div
                v-for="c in grid.cols" :key="r + '-' + c"
                class="mercury-mini-cell"
                :class="{ 'mercury-mini-selected': selected === r + '-' + c }"
                :style="{
                  width: miniSize + 'px',
                  height: miniSize + 'px',
                  background: isOff(r, c) ? '#1a1b1f' : (pixelAt(r, c).main || mainColorAt(r, c))
                }"
                @click="hitPixel(r, c)"
              />
            </template>
          </div>

          <!-- selected pixel editor -->
          <div v-if="tool === 'edit' && selected && overrides[selected]" class="q-mt-sm">
            <div class="mercury-card-title">Pixel {{ selected }} — overrides (blank = inherit)</div>
            <div class="mercury-stop-row">
              <q-toggle
                :model-value="!!overrides[selected].off"
                dense dark color="cyan-3" label="off"
                class="mercury-toggle-label"
                @update:model-value="v => { overrides[selected].off = v }"
              />
              <q-btn flat dense no-caps size="sm" color="grey-5" label="reset this pixel" @click="resetPixel" />
            </div>
            <div v-for="ln in layerNames" :key="ln" class="mercury-stop-row">
              <span class="mercury-layer-name">{{ ln }}</span>
              <div class="mercury-swatch" :style="{ background: overrides[selected][ln] || layers[ln].color }">
                <q-menu dark class="mercury-menu">
                  <div class="q-pa-sm">
                    <div v-for="group in palette" :key="group.name" class="mercury-palette-group">
                      <div class="mercury-palette-name">{{ group.name }}</div>
                      <div class="row no-wrap">
                        <div
                          v-for="c in group.colors" :key="c.name"
                          v-close-popup
                          class="mercury-chip"
                          :style="{ background: c.hex }"
                          @click="overrides[selected][ln] = c.hex"
                        >
                          <q-tooltip>{{ c.name }} {{ c.hex }}</q-tooltip>
                        </div>
                      </div>
                    </div>
                  </div>
                </q-menu>
              </div>
              <q-input
                v-model="overrides[selected][ln]"
                dense dark borderless
                class="mercury-hex-input"
                :placeholder="layers[ln].color"
              />
            </div>
          </div>
        </div>

        <!-- Canvas + boxes -->
        <div class="mercury-card q-pa-md q-mb-lg">
          <div class="row items-center q-mb-sm">
            <div class="mercury-card-title q-mb-none">Boxes</div>
            <q-space />
            <span class="mercury-slider-label q-mr-sm">canvas</span>
            <div
              v-for="bg in canvases" :key="bg.name"
              class="mercury-chip"
              :class="{ 'mercury-chip-active': canvas === bg.css }"
              :style="{ background: bg.css }"
              @click="canvas = bg.css"
            >
              <q-tooltip>{{ bg.name }}</q-tooltip>
            </div>
          </div>

          <div class="mercury-canvas" :style="{ background: canvas }">
            <div class="mercury-box mercury-box-hero rounded-2" :style="{ background: gradientCss }">
              <span class="nasalization inset-font">hero box</span>
            </div>
            <div class="row q-col-gutter-md q-mt-xs">
              <div class="col-4">
                <div class="mercury-box rounded-1" :style="{ background: gradientCss }">rounded-1</div>
              </div>
              <div class="col-4">
                <div class="mercury-box rounded-10" :style="{ background: gradientCss }">rounded-10</div>
              </div>
              <div class="col-4">
                <div class="mercury-box rounded-3" :style="{ background: gradientCss }">rounded-3</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Buttons -->
        <div class="mercury-card q-pa-md q-mb-lg">
          <div class="row items-center q-mb-sm">
            <div class="mercury-card-title q-mb-none">Quasar buttons</div>
            <q-space />
            <q-toggle v-model="labelDark" dense dark color="cyan-3" label="dark label" class="mercury-toggle-label" />
          </div>
          <div class="mercury-canvas mercury-btn-canvas" :style="{ background: canvas }">
            <q-btn unelevated no-caps label="unelevated" :style="btnStyle" />
            <q-btn unelevated rounded no-caps label="rounded" :style="btnStyle" />
            <q-btn push no-caps label="push" :style="btnStyle" />
            <q-btn glossy no-caps label="glossy" :style="btnStyle" />
            <q-btn unelevated round icon="rocket_launch" :style="btnStyle" />
            <q-btn unelevated no-caps size="lg" class="nasalization" label="nasalization" :style="btnStyle" />
          </div>
        </div>

        <!-- Presets -->
        <div class="mercury-card q-pa-md">
          <div class="mercury-card-title">Presets — click to load into the builder</div>
          <div class="row q-col-gutter-md">
            <div v-for="p in presets" :key="p.name" class="col-6 col-sm-4 col-md-3">
              <div class="mercury-preset rounded-2" :style="{ background: presetCss(p) }" @click="loadPreset(p)">
                <span class="mercury-preset-name">{{ p.name }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'

// ── ServiceConsole palette ──────────────────────────────────────────
const palette = [
  {
    name: 'light',
    colors: [
      { name: 'n-light-red', hex: '#ff9a99' },
      { name: 'n-light-blue', hex: '#99feff' },
      { name: 'n-light-pink', hex: '#ff99fe' },
      { name: 'n-light-lemon', hex: '#feff99' }
    ]
  },
  {
    name: 'mid',
    colors: [
      { name: 'n-mid-blue', hex: '#94daff' },
      { name: 'n-mid-pink', hex: '#ff94da' },
      { name: 'n-mid-lemon', hex: '#daff94' }
    ]
  },
  {
    name: 'heavy',
    colors: [
      { name: 'n-heavy-blue', hex: '#94b3fd' },
      { name: 'n-heavy-pink', hex: '#fd94b3' },
      { name: 'n-heavy-lemon', hex: '#b3fd94' }
    ]
  },
  {
    name: 'aqua',
    colors: [
      { name: 'aqua-1', hex: '#E8FFE8' },
      { name: 'aqua-2', hex: '#A6FFF2' },
      { name: 'aqua-3', hex: '#74F9FF' },
      { name: 'aqua-4', hex: '#00e0ff' }
    ]
  },
  {
    name: 'cake',
    colors: [
      { name: 'cake-green', hex: '#89F8CE' },
      { name: 'cake-lemon', hex: '#F5FAC7' },
      { name: 'cake-pink', hex: '#DEC8ED' },
      { name: 'cake-purple', hex: '#CC99F9' }
    ]
  },
  {
    name: 'surface',
    colors: [
      { name: 'surface-1', hex: '#FFFB97' },
      { name: 'surface-2', hex: '#97FFCF' },
      { name: 'surface-3', hex: '#2FE1D6' },
      { name: 'surface-4', hex: '#38C6BD' }
    ]
  },
  {
    name: 'dark',
    colors: [
      { name: 'dark-1', hex: '#404258' },
      { name: 'dark-2', hex: '#474E68' },
      { name: 'dark-3', hex: '#50577A' },
      { name: 'dark-4', hex: '#6B728E' }
    ]
  },
  {
    name: 'brand',
    colors: [
      { name: 'primary', hex: '#1976D2' },
      { name: 'secondary', hex: '#26A69A' },
      { name: 'accent', hex: '#9C27B0' },
      { name: 'positive', hex: '#21BA45' },
      { name: 'negative', hex: '#C10015' },
      { name: 'info', hex: '#31CCEC' },
      { name: 'warning', hex: '#F2C037' }
    ]
  },
  {
    name: 'misc',
    colors: [
      { name: 'light-1', hex: '#f5f5f5' },
      { name: 'dark-lemon-green', hex: '#C7CA99' },
      { name: 'dark-lemon-grey', hex: '#727572' },
      { name: 'dark', hex: '#1D1D1D' },
      { name: 'dark-page', hex: '#121212' }
    ]
  }
]

// ── Presets lifted from the ServiceConsole app stylesheet ───────────
const presets = [
  { name: 'blue-surface', type: 'radial', x: 30, y: -80, stops: [{ color: '#99feff', pct: 30 }, { color: '#feff99', pct: 80 }] },
  { name: 'red-surface', type: 'radial', x: 300, y: -40, stops: [{ color: '#ff9a99', pct: 60 }, { color: '#feff99', pct: 80 }] },
  { name: 'red-surface-bottom', type: 'radial', x: 50, y: 500, stops: [{ color: '#ff9a99', pct: 75 }, { color: '#feff99', pct: 100 }] },
  { name: 'lemon-grad', type: 'radial', x: 0, y: 107, stops: [{ color: '#feff99', pct: 0 }, { color: '#99feff', pct: 100 }] },
  { name: 'cake-grad', type: 'radial', x: 50, y: 50, stops: [{ color: '#99feff', pct: 10 }, { color: '#feff99', pct: 30 }, { color: '#99feff', pct: 100 }] },
  { name: 'cake-blue-grad', type: 'radial', x: 50, y: 50, stops: [{ color: '#99feff', pct: 30 }, { color: '#feff99', pct: 200 }] },
  { name: 'cake-lemon-grad', type: 'radial', x: 50, y: 50, stops: [{ color: '#feff99', pct: 30 }, { color: '#99feff', pct: 200 }] },
  { name: 'anti-cake-grad', type: 'radial', x: 40, y: 107, stops: [{ color: '#ff99fe', pct: 0 }, { color: '#99feff', pct: 50 }, { color: '#feff99', pct: 100 }] },
  { name: 'cake-sweep', type: 'radial', x: 30, y: 107, stops: [{ color: '#CC99F9', pct: 0 }, { color: '#DEC8ED', pct: 30 }, { color: '#F5FAC7', pct: 60 }, { color: '#89F8CE', pct: 100 }] },
  { name: 'surface-sweep', type: 'radial', x: 107, y: 30, stops: [{ color: '#FFFB97', pct: 0 }, { color: '#97FFCF', pct: 50 }, { color: '#2FE1D6', pct: 100 }] },
  { name: 'aqua-sweep', type: 'radial', x: 107, y: 30, stops: [{ color: '#E8FFE8', pct: 0 }, { color: '#A6FFF2', pct: 50 }, { color: '#74F9FF', pct: 100 }] },
  { name: 'blue-depths', type: 'radial', x: 60, y: 107, stops: [{ color: '#99feff', pct: 0 }, { color: '#94daff', pct: 50 }, { color: '#94b3fd', pct: 100 }] },
  { name: 'party-stripe', type: 'linear', angle: 90, stops: [{ color: '#E8FFE8', pct: 15 }, { color: '#DEC8ED', pct: 20 }, { color: '#F5FAC7', pct: 75 }, { color: '#89F8CE', pct: 100 }] }
]

// Solid backgrounds the ServiceConsole body has cycled through.
const canvases = [
  { name: 'black', css: 'black' },
  { name: 'ink #1a1b1f', css: '#1a1b1f' },
  { name: 'dark-bg #252520', css: '#252520' },
  { name: 'dark-2 #474E68', css: '#474E68' },
  { name: 'grey #BDBDBD', css: '#BDBDBD' },
  { name: 'paper #EEEEEE', css: '#EEEEEE' },
  { name: 'light-1 #f5f5f5', css: '#f5f5f5' }
]

// ── Builder state — starts on cake-grad ─────────────────────────────
const type = ref('radial')
const posX = ref(50)
const posY = ref(50)
const angle = ref(90)
const stops = ref([
  { color: '#99feff', pct: 10 },
  { color: '#feff99', pct: 30 },
  { color: '#99feff', pct: 100 }
])
const canvas = ref('black')
const labelDark = ref(true)
const copied = ref(false)

const gradientCss = computed(() => {
  const s = stops.value.map(st => `${st.color} ${st.pct}%`).join(', ')
  return type.value === 'radial'
    ? `radial-gradient(circle at ${posX.value}% ${posY.value}%, ${s})`
    : `linear-gradient(${angle.value}deg, ${s})`
})

// backgroundColor fallback: q-btn glossy overrides background-image with
// !important, so glossy buttons render their gloss over the first stop.
const btnStyle = computed(() => ({
  background: gradientCss.value,
  backgroundColor: stops.value[0]?.color,
  color: labelDark.value ? '#455A64' : '#ffffff'
}))

// ── Pixel grid lab ──────────────────────────────────────────────────
// A "pixel" = 3 stacked layers: shadow (offset, behind), main (the body)
// and glass (translucent + backdrop blur on top). `layers` drives every
// pixel; `overrides` holds per-pixel exceptions keyed "row-col"
// ({ off, shadow, main, glass }). A future pass can swap per-pixel color
// for a single background painted across the whole grid.
const layerNames = ['shadow', 'main', 'glass']
const grid = reactive({ cols: 16, rows: 8, size: 34, gap: 4 })
const layers = reactive({
  shadow: { color: '#455A64', opacity: 0.9, radius: 30, dx: 2, dy: 2 },
  main: { color: '#99feff', opacity: 1, radius: 30 },
  glass: { color: '#fff3e0', opacity: 0.25, radius: 30, blur: 2 }
})
const tool = ref('off')
const selected = ref(null)
const overrides = ref({})

// ── Wave frieze pattern (friso del grupo 2, bar style) ──────────────
// One 22-row × 20-col tile at 2px per design unit. Rows 0-9: wave 'A'
// standing ON the bar — a 10×10 head whose square spiral is carved as
// a 1px groove (2px arms) entering from the LEFT edge, then a 4-step
// staircase descending right (2px treads), then a 2-col gap. Rows
// 10-11: '=' the continuous horizontal bar (always the light color,
// never swaps). Rows 12-21: wave 'B' = the exact 180° rotation of A
// hanging upside-down below the bar — its spiral head sits under A's
// staircase, groove opening on the RIGHT edge. '.' = pixel off. Loops
// horizontally via col % 20; A/B colorways swap each period so waves
// alternate dark/light along the band like the reference.
const WAVE_TILE = [
  'AAAAAAAAAAAA........',
  'AAAAAAAAAAAA........',
  '........AAAAAA......',
  'AAAAAAA.AAAAAA......',
  'AA....A.AAAAAAAA....',
  'AA.AAAA.AAAAAAAA....',
  'AA.AAAA.AAAAAAAAAA..',
  'AA......AAAAAAAAAA..',
  'AAAAAAAAAAAAAAAAAA..',
  'AAAAAAAAAAAAAAAAAA..',
  '====================',
  '====================',
  '..BBBBBBBBBBBBBBBBBB',
  '..BBBBBBBBBBBBBBBBBB',
  '..BBBBBBBBBB......BB',
  '..BBBBBBBBBB.BBBB.BB',
  '....BBBBBBBB.BBBB.BB',
  '....BBBBBBBB.B....BB',
  '......BBBBBB.BBBBBBB',
  '......BBBBBB........',
  '........BBBBBBBBBBBB',
  '........BBBBBBBBBBBB'
]
const pattern = ref(false)
const patternColors = reactive({ a: '#4b4b4b', b: '#b3b3b3' })

function patternCell (r, c) {
  const ch = WAVE_TILE[(r - 1) % 22][(c - 1) % 20]
  if (ch === '.') return { off: true }
  if (ch === '=') return { off: false, color: patternColors.b }
  const swap = Math.floor((c - 1) / 20) % 2 === 1
  return { off: false, color: patternColors[(ch === 'A') !== swap ? 'a' : 'b'] }
}

function isOff (r, c) {
  const o = pixelAt(r, c)
  if (o.off !== undefined) return o.off
  return pattern.value ? patternCell(r, c).off : false
}

function mainColorAt (r, c) {
  if (pattern.value) return patternCell(r, c).color || layers.main.color
  return layers.main.color
}

// Constrain the grid to the pattern: 22 rows tall, cols in whole
// 20-col periods (sliders snap while the pattern is on). Three periods
// by default so the mosaic repetition reads; gap 0 for solid masses.
function toggleWave (v) {
  pattern.value = v
  if (v) {
    grid.rows = 22
    grid.cols = 60
    grid.size = 9
    grid.gap = 0
  }
}

const gridStyle = computed(() => ({
  display: 'grid',
  gridTemplateColumns: `repeat(${grid.cols}, ${grid.size}px)`,
  gap: grid.gap + 'px',
  width: 'fit-content',
  margin: '0 auto'
}))

// Mini cells shrink as the grid widens so 60-80 cols still fit the card.
const miniSize = computed(() => (grid.cols > 48 ? 8 : grid.cols > 32 ? 10 : 14))

const miniGridStyle = computed(() => ({
  display: 'grid',
  gridTemplateColumns: `repeat(${grid.cols}, ${miniSize.value}px)`,
  gap: grid.cols > 32 ? '1px' : '2px',
  width: 'fit-content',
  margin: '0 auto'
}))

function pixelAt (r, c) {
  return overrides.value[`${r}-${c}`] || {}
}

function layerStyle (name, r, c) {
  const L = layers[name]
  let color = pixelAt(r, c)[name] || L.color
  if (name === 'main' && !pixelAt(r, c).main && pattern.value) {
    color = patternCell(r, c).color || L.color
  }
  const style = {
    background: color,
    opacity: L.opacity,
    borderRadius: L.radius + '%'
  }
  if (name === 'shadow') style.transform = `translate(${L.dx}px, ${L.dy}px)`
  if (name === 'glass') {
    style.backdropFilter = `blur(${L.blur}px)`
    style.webkitBackdropFilter = `blur(${L.blur}px)`
  }
  return style
}

function hitPixel (r, c) {
  const key = `${r}-${c}`
  if (tool.value === 'off') {
    const o = { ...(overrides.value[key] || {}) }
    o.off = !isOff(r, c)
    overrides.value[key] = o
  } else {
    if (!overrides.value[key]) overrides.value[key] = {}
    selected.value = key
  }
}

function resetPixel () {
  if (selected.value) overrides.value[selected.value] = {}
}

function clearOverrides () {
  overrides.value = {}
  selected.value = null
}

// ── Tile board — single-layer two-color drawing board ───────────────
// One editable tile whose drawing is live-replicated left and right
// (3 repetitions) to test horizontal tiling continuity. Every cell is
// ONE flat div (no shadow/glass layers) — neon color on dark. Clicks
// anywhere on the strip write to the same tile map via col % cols, so
// you can draw straight across a seam and watch it wrap. While the
// board is on, the other preview cards (3-layer pixel grid, boxes,
// buttons, presets) are unmounted to free resources.
const board = reactive({ on: true, cols: 20, rows: 22, size: 12, radius: 15 })
const boardCells = ref({})
const boardPaint = ref('a')
const boardColors = reactive({ a: '#00e0ff', b: '#ff99fe' })
const painting = ref(false)

// No gap between cells — pixels fuse into continuous figures; the
// drawing reads as shapes, not as an LED matrix.
const boardStyle = computed(() => ({
  display: 'grid',
  gridTemplateColumns: `repeat(${board.cols * 3}, ${board.size}px)`,
  gap: '0',
  width: 'fit-content',
  margin: '0 auto'
}))

function boardKey (r, c) {
  return r + '-' + (((c - 1) % board.cols) + 1)
}

function paintCell (r, c) {
  const key = boardKey(r, c)
  if (boardPaint.value === 'erase') delete boardCells.value[key]
  else boardCells.value[key] = boardPaint.value
}

function startPaint (r, c) {
  painting.value = true
  paintCell(r, c)
}

function dragPaint (r, c) {
  if (painting.value) paintCell(r, c)
}

function boardCellColor (r, c) {
  const v = boardCells.value[boardKey(r, c)]
  return v ? boardColors[v] : '#1d1f24'
}

// Faint guide lines where the tile seams sit (after col N and 2N).
function seamStyle (i) {
  return { left: (i * board.cols * board.size - 1) + 'px' }
}

function clearBoard () {
  boardCells.value = {}
}

// ── Tile export / interpret ─────────────────────────────────────────
// Plain-text format made to live in notes: a MERCURY-TILE header,
// key: value settings, then "map:" followed by one row per line where
// '.' = off, 'a'/'b' = the two waves. "save" copies it to the
// clipboard (and mirrors it into the textarea as a fallback);
// "interpret" parses whatever is pasted in the textarea and rebuilds
// the board — settings, colors and color matrix.
const boardIO = ref('')
const boardIOStatus = ref('')

function exportBoard () {
  const lines = [
    'MERCURY-TILE v1',
    `cols: ${board.cols}`,
    `rows: ${board.rows}`,
    `size: ${board.size}`,
    `radius: ${board.radius}`,
    `a: ${boardColors.a}`,
    `b: ${boardColors.b}`,
    'map:'
  ]
  for (let r = 1; r <= board.rows; r++) {
    let row = ''
    for (let c = 1; c <= board.cols; c++) {
      const v = boardCells.value[`${r}-${c}`]
      row += v === 'a' ? 'a' : v === 'b' ? 'b' : '.'
    }
    lines.push(row)
  }
  const text = lines.join('\n')
  boardIO.value = text
  navigator.clipboard.writeText(text).then(
    () => { boardIOStatus.value = 'copied — paste it in your notes' },
    () => { boardIOStatus.value = 'clipboard blocked — copy the text below manually' }
  )
}

function interpretBoard () {
  try {
    const lines = boardIO.value.split(/\r?\n/).map(l => l.trim()).filter(l => l.length)
    if (!lines.length || !lines[0].startsWith('MERCURY-TILE')) {
      throw new Error('missing "MERCURY-TILE" header')
    }
    const mapIdx = lines.findIndex(l => l.toLowerCase() === 'map:')
    if (mapIdx === -1) throw new Error('missing "map:" section')
    const cfg = {}
    for (const line of lines.slice(1, mapIdx)) {
      const m = line.match(/^(\w+)\s*:\s*(.+)$/)
      if (m) cfg[m[1].toLowerCase()] = m[2].trim()
    }
    const rowLines = lines.slice(mapIdx + 1)
    const nRows = parseInt(cfg.rows) || rowLines.length
    const nCols = parseInt(cfg.cols) || Math.max(0, ...rowLines.map(l => l.length))
    if (!nRows || !nCols) throw new Error('could not determine tile dimensions')
    const cells = {}
    rowLines.slice(0, nRows).forEach((row, i) => {
      for (let c = 0; c < Math.min(row.length, nCols); c++) {
        const ch = row[c].toLowerCase()
        if (ch === 'a' || ch === 'b') cells[`${i + 1}-${c + 1}`] = ch
      }
    })
    board.cols = Math.min(Math.max(nCols, 4), 40)
    board.rows = Math.min(Math.max(nRows, 4), 32)
    if (cfg.size) board.size = Math.min(Math.max(parseInt(cfg.size), 6), 24)
    if (cfg.radius !== undefined) board.radius = Math.min(Math.max(parseInt(cfg.radius) || 0, 0), 50)
    if (cfg.a) boardColors.a = cfg.a
    if (cfg.b) boardColors.b = cfg.b
    boardCells.value = cells
    board.on = true
    boardIOStatus.value = `interpreted: ${board.cols}×${board.rows} tile, ${Object.keys(cells).length} lit pixels`
  } catch (e) {
    boardIOStatus.value = 'could not interpret: ' + e.message
  }
}

// ── SVG export — one pattern per wave ───────────────────────────────
// The tile as a standalone SVG, canvas exactly cols×rows cells with NO
// gaps and NO per-cell rounding: adjacent cells share edges exactly so
// the drawing exports as ONE continuous figure (shape-rendering
// crispEdges kills anti-alias hairlines between touching rects), and
// it tiles seamlessly as a repeating background-image. `wave` = 'a' |
// 'b' exports ONLY that wave's cells on a TRANSPARENT canvas, filled
// PURE WHITE — the neutral mask base: use it as a CSS mask-image
// (alpha does the work) and paint the element any color, or tint
// white via blend modes/filters. No wave = both waves in their real
// colors plus the dark board background.
function boardSvg (wave) {
  const s = board.size
  const w = board.cols * s
  const h = board.rows * s
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges">`
  ]
  if (!wave) parts.push(`<rect width="${w}" height="${h}" fill="#0b0c10"/>`)
  for (let r = 1; r <= board.rows; r++) {
    for (let c = 1; c <= board.cols; c++) {
      const v = boardCells.value[`${r}-${c}`]
      if (!v || (wave && v !== wave)) continue
      parts.push(
        `<rect x="${(c - 1) * s}" y="${(r - 1) * s}" width="${s}" height="${s}" fill="${wave ? '#ffffff' : boardColors[v]}"/>`
      )
    }
  }
  parts.push('</svg>')
  return parts.join('\n')
}

function downloadSvg (wave) {
  const name = wave ? `mercury-wave-${wave}.svg` : 'mercury-tile.svg'
  const blob = new Blob([boardSvg(wave)], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
  boardIOStatus.value = wave
    ? `${name} downloaded — white on transparent: use as mask-image and paint any color`
    : `${name} downloaded — use it as a repeating background-image`
}

// ── Frieze header ───────────────────────────────────────────────────
// Thin full-bleed strip at the top of the page. Two SVGs (imported
// files or the board's own waves) become mask-images on stacked
// layers: each layer's backgroundColor shines through its mask's
// white cells, repeat-x tiles the frieze side-to-side, and mask-size
// auto 100% scales it to the padded strip height. The strip surface
// is a metallic sheen painted over frieze.bg.
// `scale` = motif height as a % of the strip: lower → each frieze SVG
// shrinks and MORE of them tile side-to-side to complete the band.
const frieze = reactive({ height: 44, pad: 4, bg: '#474E68', scale: 100 })
const friezeFiles = reactive({ one: null, two: null })
const friezeLayers = reactive({
  one: { url: '', color: '#00e0ff' },
  two: { url: '', color: '#ff99fe' }
})
// Glass overlayer painted on top of both frieze layers + the metallic
// base: a chooseable tint at `opacity`, with an optional glassy edge.
const glass = reactive({ color: '#a6fff2', opacity: 0.18, border: true })
// Carve: paired drop-shadows on the masked silhouettes — a `light` edge
// down-right and a `dark` edge up-left — so the motif reads as incised
// into the plaque with a needle. `depth` = the offset in px.
const carve = reactive({ depth: 1.5, light: '#ffffff', dark: '#0b0c10' })

function svgCssUrl (text) {
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(text)}")`
}

function onFriezeFile (which, file) {
  if (!file) {
    friezeLayers[which].url = ''
    return
  }
  file.text().then(t => { friezeLayers[which].url = svgCssUrl(t) })
}

function friezeFromBoard () {
  friezeLayers.one.url = svgCssUrl(boardSvg('a'))
  friezeLayers.two.url = svgCssUrl(boardSvg('b'))
  friezeFiles.one = null
  friezeFiles.two = null
}

const friezeHeaderStyle = computed(() => ({
  height: frieze.height + 'px',
  padding: frieze.pad + 'px 0',
  background:
    'linear-gradient(180deg, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0.12) 14%, ' +
    'rgba(0,0,0,0.16) 46%, rgba(255,255,255,0.16) 56%, rgba(0,0,0,0.38) 100%), ' + frieze.bg
}))

function hexToRgba (hex, a) {
  let h = String(hex).replace('#', '').trim()
  if (h.length === 3) h = h.split('').map(x => x + x).join('')
  const n = parseInt(h, 16)
  if (Number.isNaN(n)) return `rgba(255,255,255,${a})`
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
}

function friezeLayerStyle (which) {
  const L = friezeLayers[which]
  if (!L.url) return { display: 'none' }
  const size = 'auto ' + frieze.scale + '%'
  const style = {
    backgroundColor: L.color,
    maskImage: L.url,
    maskRepeat: 'repeat-x',
    maskSize: size,
    maskPosition: 'left center',
    webkitMaskImage: L.url,
    webkitMaskRepeat: 'repeat-x',
    webkitMaskSize: size,
    webkitMaskPosition: 'left center'
  }
  // Carve: shadow up-left, highlight down-right — colours the silhouette
  // edges so the pattern looks needle-cut into the plaque. Each side is
  // stacked (full + half offset) so the coloured edge fills into a solid
  // band rather than a hairline — a thicker, more noticeable groove.
  if (carve.depth > 0) {
    const d = carve.depth
    const f =
      `drop-shadow(${-d}px ${-d}px 0 ${carve.dark}) ` +
      `drop-shadow(${-d / 2}px ${-d / 2}px 0 ${carve.dark}) ` +
      `drop-shadow(${d}px ${d}px 0 ${carve.light}) ` +
      `drop-shadow(${d / 2}px ${d / 2}px 0 ${carve.light})`
    style.filter = f
    style.webkitFilter = f
  }
  return style
}

const glassStyle = computed(() => {
  const tint = hexToRgba(glass.color, glass.opacity)
  const style = {
    // diagonal white sheen over the chosen tint = glassy reflection
    background:
      'linear-gradient(135deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.05) 22%, ' +
      'rgba(255,255,255,0) 46%, rgba(255,255,255,0.06) 72%, rgba(255,255,255,0.18) 100%), ' +
      tint
  }
  if (glass.border) {
    style.border = '1px solid ' + hexToRgba(glass.color, Math.min(1, glass.opacity + 0.4))
    // top/left catch light, bottom/right pick up a thin shadow → bevelled glass
    style.boxShadow =
      'inset 0 1px 0 rgba(255,255,255,0.55), inset 1px 0 0 rgba(255,255,255,0.14), ' +
      'inset 0 -1px 0 rgba(0,0,0,0.22), inset -1px 0 0 rgba(0,0,0,0.16)'
  }
  return style
})

function presetCss (p) {
  const s = p.stops.map(st => `${st.color} ${st.pct}%`).join(', ')
  return p.type === 'radial'
    ? `radial-gradient(circle at ${p.x}% ${p.y}%, ${s})`
    : `linear-gradient(${p.angle}deg, ${s})`
}

function loadPreset (p) {
  type.value = p.type
  if (p.type === 'radial') {
    posX.value = p.x
    posY.value = p.y
  } else {
    angle.value = p.angle
  }
  stops.value = p.stops.map(st => ({ ...st }))
}

function addStop (color) {
  stops.value.push({ color, pct: 100 })
}

function removeStop (i) {
  if (stops.value.length > 2) stops.value.splice(i, 1)
}

async function copyCss () {
  try {
    await navigator.clipboard.writeText(`background: ${gradientCss.value};`)
    copied.value = true
    setTimeout(() => { copied.value = false }, 1200)
  } catch {
    // clipboard unavailable (http, permissions) — the CSS is on screen anyway
  }
}
</script>

<style scoped lang="scss">
.mercury-title {
  color: #dde7f2;
  letter-spacing: 0.06em;
}
.mercury-sub {
  color: #8fa5bc;
}

.mercury-card {
  background: #2b3947;
  border: 1px solid rgba(116, 249, 255, 0.18);
  border-radius: 0.66em;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 4px 18px rgba(0, 0, 0, 0.35);
}
.mercury-card-title {
  color: #8fa5bc;
  font-size: 0.68em;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.mercury-slider-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.mercury-slider-label {
  color: #dde7f2;
  font-size: 0.75em;
  white-space: nowrap;
  min-width: 72px;
}
.mercury-pct {
  min-width: 42px;
  text-align: right;
}

.mercury-stop-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 2px;
}
.mercury-swatch {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.35);
  cursor: pointer;
  flex-shrink: 0;
}
.mercury-hex-input {
  width: 76px;
  :deep(input) {
    color: #dde7f2;
    font-size: 0.75em;
    font-family: monospace;
  }
}

.mercury-palette-group {
  margin-bottom: 4px;
}
.mercury-palette-name {
  color: #8fa5bc;
  font-size: 0.62em;
  letter-spacing: 0.1em;
}
.mercury-chip {
  width: 22px;
  height: 22px;
  border-radius: 5px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  margin: 2px 4px 2px 0;
  cursor: pointer;
  transition: transform 0.1s;
  &:hover { transform: scale(1.18); }
}
.mercury-chip-active {
  outline: 2px solid #74F9FF;
  outline-offset: 1px;
}

.mercury-css {
  color: #A6FFF2;
  background: rgba(0, 0, 0, 0.35);
  border-radius: 6px;
  padding: 8px 10px;
  font-size: 0.72em;
  white-space: pre-wrap;
  word-break: break-all;
}

.mercury-canvas {
  border-radius: 0.66em;
  padding: 20px;
  transition: background 0.2s;
}
.mercury-box {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 90px;
  color: #455A64;
  font-size: 0.8em;
  font-weight: 600;
}
.mercury-box-hero {
  height: 160px;
  font-size: 1.1em;
}

.mercury-layer-name {
  color: #dde7f2;
  font-size: 0.72em;
  letter-spacing: 0.08em;
  min-width: 52px;
  text-transform: uppercase;
}
.mercury-tight {
  min-width: 0;
}
.mercury-sub-row {
  padding-left: 60px;
}

.mercury-pixel {
  position: relative;
  cursor: pointer;
}
.mercury-pixel-layer {
  position: absolute;
  inset: 0;
}

.mercury-mini-cell {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  cursor: pointer;
  &:hover { transform: scale(1.2); }
}
.mercury-mini-selected {
  outline: 2px solid #74F9FF;
  outline-offset: 1px;
}

// ── Frieze header ── full-bleed metallic strip. The negative margins
// cancel q-page's q-pa-lg (24px) so the frieze touches the screen
// edges; the inset shadows are the machined top/bottom lips.
.mercury-frieze-header {
  margin: -24px -24px 20px;
  position: relative;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.55),
    inset 0 -1px 0 rgba(0, 0, 0, 0.65),
    0 4px 16px rgba(0, 0, 0, 0.5);
}
.mercury-frieze-inner {
  position: relative;
  height: 100%;
}
.mercury-frieze-layer {
  position: absolute;
  inset: 0;
}
.mercury-frieze-glass {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.mercury-frieze-empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.45);
  font-size: 0.72em;
  letter-spacing: 0.12em;
}
.mercury-file {
  width: 190px;
}

.mercury-board-canvas {
  background: #0b0c10;
  overflow-x: auto;
}
.mercury-board-wrap {
  position: relative;
  width: fit-content;
  margin: 0 auto;
}
.mercury-board-cell {
  cursor: crosshair;
}
.mercury-seam {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: rgba(116, 249, 255, 0.45);
  pointer-events: none;
}
.mercury-board-hint {
  color: #8fa5bc;
  font-size: 0.68em;
  text-align: center;
  margin-top: 8px;
}
.mercury-io-status {
  color: #A6FFF2;
  font-size: 0.72em;
}
.mercury-io :deep(textarea) {
  font-family: monospace;
  font-size: 0.78em;
  line-height: 1.25;
  white-space: pre;
}

.mercury-btn-canvas {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 14px;
}

.mercury-preset {
  height: 84px;
  display: flex;
  align-items: flex-end;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.25);
  transition: transform 0.12s;
  &:hover { transform: translateY(-2px); }
}
.mercury-preset-name {
  color: #455A64;
  font-size: 0.68em;
  font-weight: 700;
  padding: 4px 8px;
  text-shadow: #ffffff 1px 1px 0;
}

.mercury-toggle {
  border: 1px solid rgba(116, 249, 255, 0.3);
  border-radius: 6px;
}
.mercury-toggle-label :deep(.q-toggle__label) {
  color: #dde7f2;
  font-size: 0.8em;
}
</style>
