// Compiles a dart2wasm-generated main module from `source` which can then
// be instantiated via the `instantiate` method.
//
// `source` needs to be a `Response` object (or promise thereof) e.g. created
// via the `fetch()` JS API.
export async function compileStreaming(source) {
  const builtins = {builtins: ['js-string'], importedStringConstants: ''};
  return new CompiledApp(
      await _compileStreaming(source, builtins), builtins);
}

// Compiles a dart2wasm-generated wasm module from `bytes` which is then
// instantiable via the `instantiate` method.
export async function compile(bytes) {
  const builtins = {builtins: ['js-string'], importedStringConstants: ''};
  return new CompiledApp(await WebAssembly.compile(bytes, builtins), builtins);
}

let _isCompileStreamingSupported;
async function _compileStreaming(source, builtins) {
  _isCompileStreamingSupported ??= WebAssembly.compileStreaming(
    new Response(
      new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,2,23,1,14,119,97,115,109,58,106,115,45,115,116,114,105,110,103,4,99,97,115,116,0,0]),
      {headers: {'Content-Type': 'application/wasm'}},
    ),
    builtins,
  ).then(() => false, (e) => e instanceof WebAssembly.CompileError);
  if (await _isCompileStreamingSupported) {
    return WebAssembly.compileStreaming(source, builtins);
  }
  return WebAssembly.compile(await (await source).arrayBuffer(), builtins);
}

class CompiledApp {
  constructor(module, builtins) {
    this.module = module;
    this.builtins = builtins;
  }

  // The second argument is an options object containing:
  // `loadDeferredModules` is a JS function that takes an array of module names
  //   matching wasm files produced by the dart2wasm compiler. It also takes a
  //   callback that should be invoked for each loaded module with 2 arguments:
  //   (1) the module name, (2) the loaded module in a format supported by
  //   `WebAssembly.compile` or `WebAssembly.compileStreaming`. The callback
  //   returns a Promise that resolves when the module is instantiated.
  //   loadDeferredModules should return a Promise that resolves when all the
  //   modules have been loaded and the callback promises have resolved.
  // `loadDeferredId` is a JS function that takes load ID produced by the
  //   compiler when the `use-load-ids` option is passed. Each load ID maps to
  //   one or more wasm files as specified in the emitted JSON file. It also
  //   takes a callback that should be invoked for each loaded module with 2
  //   arguments: (1) the module name, (2) the loaded module in a format
  //   supported by `WebAssembly.compile` or `WebAssembly.compileStreaming`.
  //   The callback returns a Promise that resolves when the module is
  //   instantiated.
  //   loadDeferredId should return a Promise that resolves when all the
  //   modules have been loaded and the callback promises have resolved.
  async instantiate(additionalImports, {loadDeferredModules, loadDeferredId} = {}) {
    let dartInstance;

    // Prints to the console
    function printToConsole(value) {
      if (typeof dartPrint == "function") {
        dartPrint(value);
        return;
      }
      if (typeof console == "object" && typeof console.log != "undefined") {
        console.log(value);
        return;
      }
      if (typeof print == "function") {
        print(value);
        return;
      }

      throw "Unable to print message: " + value;
    }

    // A special symbol attached to functions that wrap Dart functions.
    const jsWrappedDartFunctionSymbol = Symbol("JSWrappedDartFunction");

    function finalizeWrapper(dartFunction, wrapped) {
      wrapped.dartFunction = dartFunction;
      wrapped[jsWrappedDartFunctionSymbol] = true;
      return wrapped;
    }

    // Imports
    const dart2wasm = {
            AB: x0 => new Int16Array(x0),
      AC: (o, start, length) => new Uint8Array(o.buffer, o.byteOffset + start, length),
      AD: (x0,x1,x2) => x0.addEventListener(x1,x2),
      AE: (o, i) => o[i],
      AF: x0 => x0.tiltY,
      AG: x0 => x0.current(),
      AH: (x0,x1) => x0.removeAttribute(x1),
      AI: x0 => x0.stopPropagation(),
      AJ: (o, offsetInBytes, lengthInBytes) => {
        var dst = new ArrayBuffer(lengthInBytes);
        new Uint8Array(dst).set(new Uint8Array(o, offsetInBytes, lengthInBytes));
        return new DataView(dst);
      },
      AK: (x0,x1) => x0.getAttribute(x1),
      AL: x0 => new firebase_auth.OAuthProvider(x0),
      AM: (x0,x1,x2) => ({errorMap: x0,persistence: x1,popupRedirectResolver: x2}),
      AN: () => globalThis.firebase_firestore.serverTimestamp(),
      AO: x0 => globalThis.firebase_firestore.deleteDoc(x0),
      AP: (x0,x1) => { x0.text = x1 },
      B: s => printToConsole(s),
      BB: x0 => new Uint16Array(x0),
      BC: (o, start, length) => new Int8Array(o.buffer, o.byteOffset + start, length),
      BD: (x0,x1,x2) => x0.setAttribute(x1,x2),
      BE: o => o.length,
      BF: x0 => x0.tiltX,
      BG: (x0,x1) => new Intl.v8BreakIterator(x0,x1),
      BH: (x0,x1) => { x0.value = x1 },
      BI: x0 => x0.disabled,
      BJ: (a, s, e) => a.slice(s, e),
      BK: (x0,x1) => x0.debug(x1),
      BL: (x0,x1) => globalThis.firebase_auth.GoogleAuthProvider.credential(x0,x1),
      BM: (x0,x1) => globalThis.firebase_auth.initializeAuth(x0,x1),
      BN: x0 => new firebase_firestore.FieldPath(x0),
      BO: (x0,x1) => ({includeMetadataChanges: x0,source: x1}),
      BP: x0 => x0.trustedTypes,
      C: Function.prototype.call.bind(Number.prototype.toString),
      CB: x0 => new Int32Array(x0),
      CC: (x0,x1) => x0.querySelector(x1),
      CD: (x0,x1) => x0.closest(x1),
      CE: o => {
        if (o === undefined) return 1;
        var type = typeof o;
        if (type === 'boolean') return 2;
        if (type === 'number') return 3;
        if (type === 'string') return 4;
        if (o instanceof Array) return 5;
        if (ArrayBuffer.isView(o)) {
          if (o instanceof Int8Array) return 6;
          if (o instanceof Uint8Array) return 7;
          if (o instanceof Uint8ClampedArray) return 8;
          if (o instanceof Int16Array) return 9;
          if (o instanceof Uint16Array) return 10;
          if (o instanceof Int32Array) return 11;
          if (o instanceof Uint32Array) return 12;
          if (o instanceof Float32Array) return 13;
          if (o instanceof Float64Array) return 14;
          if (o instanceof DataView) return 15;
        }
        if (o instanceof ArrayBuffer) return 16;
        // Feature check for `SharedArrayBuffer` before doing a type-check.
        if (globalThis.SharedArrayBuffer !== undefined &&
            o instanceof SharedArrayBuffer) {
            return 17;
        }
        if (o instanceof Promise) return 18;
        return 19;
      },
      CF: x0 => x0.pointerType,
      CG: x0 => x0.v8BreakIterator,
      CH: (x0,x1) => { x0.value = x1 },
      CI: (x0,x1) => { x0.min = x1 },
      CJ: (o, p) => p in o,
      CK: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      CL: (x0,x1) => x0.getIdToken(x1),
      CM: () => globalThis.firebase_auth.browserPopupRedirectResolver,
      CN: (x0,x1) => new firebase_firestore.FieldPath(x0,x1),
      CO: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      CP: (x0,x1) => { x0.crossOrigin = x1 },
      D: Function.prototype.call.bind(BigInt.prototype.toString),
      DB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI32ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      DC: (x0,x1) => x0.item(x1),
      DD: (ms, c) =>
      setTimeout(() => dartInstance.exports.$invokeCallback(c),ms),
      DE: x0 => x0.language,
      DF: x0 => x0.pointerId,
      DG: () => globalThis.Intl,
      DH: x0 => x0.value,
      DI: (x0,x1) => { x0.max = x1 },
      DJ: x0 => x0.groups,
      DK: x0 => ({createScriptURL: x0}),
      DL: x0 => x0.providerId,
      DM: () => globalThis.firebase_auth.debugErrorMap,
      DN: (x0,x1,x2) => new firebase_firestore.FieldPath(x0,x1,x2),
      DO: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      DP: (x0,x1) => { x0.type = x1 },
      E: (exn) => {
        let stackString = exn.toString();
        let frames = stackString.split('\n');
        let drop = 4;
        if (frames[0].startsWith('Error')) {
            drop += 1;
        }
        return frames.slice(drop).join('\n');
      },
      EB: x0 => new Uint32Array(x0),
      EC: x0 => x0.length,
      ED: (handle) => clearTimeout(handle),
      EE: (x0,x1,x2,x3) => x0.register(x1,x2,x3),
      EF: x0 => x0.getCoalescedEvents(),
      EG: (x0,x1) => x0.segment(x1),
      EH: x0 => x0.selectionDirection,
      EI: (x0,x1) => { x0.disabled = x1 },
      EJ: x0 => x0.pop(),
      EK: (x0,x1,x2) => x0.createPolicy(x1,x2),
      EL: x0 => x0.uid,
      EM: () => globalThis.firebase_auth.browserSessionPersistence,
      EN: (x0,x1,x2,x3) => new firebase_firestore.FieldPath(x0,x1,x2,x3),
      EO: (x0,x1,x2,x3) => globalThis.firebase_firestore.onSnapshot(x0,x1,x2,x3),
      EP: (o) => Array.isArray(o) || o instanceof Array,
      F: () => new Error().stack,
      FB: x0 => new Float32Array(x0),
      FC: (x0,x1) => x0.querySelectorAll(x1),
      FD: x0 => x0.maxTouchPoints,
      FE: () => globalThis.window.FinalizationRegistry,
      FF: s => s.trimLeft(),
      FG: x0 => x0.index,
      FH: x0 => x0.selectionStart,
      FI: (x0,x1) => { x0.scrollLeft = x1 },
      FJ: (x0,x1) => x0.getRandomValues(x1),
      FK: (x0,x1) => x0.createScriptURL(x1),
      FL: x0 => x0.providerData,
      FM: () => globalThis.firebase_auth.browserLocalPersistence,
      FN: (x0,x1,x2,x3,x4) => new firebase_firestore.FieldPath(x0,x1,x2,x3,x4),
      FO: (x0,x1,x2) => globalThis.firebase_firestore.onSnapshot(x0,x1,x2),
      FP: (x0,x1,x2,x3) => x0.addEventListener(x1,x2,x3),
      G: s => JSON.stringify(s),
      GB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmF32ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      GC: (x0,x1) => x0.getAttribute(x1),
      GD: x0 => x0.platform,
      GE: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      GF: (x0,x1) => x0[x1],
      GG: x0 => x0.next(),
      GH: x0 => x0.selectionEnd,
      GI: (x0,x1) => { x0.spellcheck = x1 },
      GJ: () => globalThis.crypto,
      GK: (x0,x1) => x0.appendChild(x1),
      GL: x0 => x0.tenantId,
      GM: () => globalThis.firebase_auth.indexedDBLocalPersistence,
      GN: (x0,x1,x2,x3,x4,x5) => new firebase_firestore.FieldPath(x0,x1,x2,x3,x4,x5),
      GO: x0 => x0.metadata,
      GP: (x0,x1,x2,x3) => x0.removeEventListener(x1,x2,x3),
      H: Function.prototype.call.bind(Number.prototype.toString),
      HB: x0 => new Float64Array(x0),
      HC: x0 => x0.remove(),
      HD: s => new Date(s * 1000).getTimezoneOffset() * 60,
      HE: x0 => new window.FinalizationRegistry(x0),
      HF: x0 => x0.index,
      HG: x0 => x0.value,
      HH: x0 => x0.value,
      HI: (x0,x1) => { x0.disabled = x1 },
      HJ: l => new DataView(new ArrayBuffer(l)),
      HK: x0 => x0.head,
      HL: x0 => x0.refreshToken,
      HM: (x0,x1) => globalThis.firebase_auth.signInWithCredential(x0,x1),
      HN: (x0,x1,x2,x3,x4,x5,x6) => new firebase_firestore.FieldPath(x0,x1,x2,x3,x4,x5,x6),
      HO: x0 => x0.doc,
      HP: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      I: Function.prototype.call.bind(String.prototype.indexOf),
      IB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmF64ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      IC: (x0,x1) => x0.appendChild(x1),
      ID: Date.now,
      IE: (x0,x1) => x0.unregister(x1),
      IF: (x0,x1) => x0.exec(x1),
      IG: x0 => x0.done,
      IH: x0 => x0.selectionDirection,
      II: (x0,x1,x2,x3,x4,x5,x6,x7,x8,x9) => x0.drawImage(x1,x2,x3,x4,x5,x6,x7,x8,x9),
      IJ: (x0,x1) => x0.removeItem(x1),
      IK: (x0,x1) => { x0.nonce = x1 },
      IL: x0 => x0.photoURL,
      IM: x0 => globalThis.firebase_auth.signInAnonymously(x0),
      IN: (x0,x1,x2,x3,x4,x5,x6,x7) => new firebase_firestore.FieldPath(x0,x1,x2,x3,x4,x5,x6,x7),
      IO: x0 => x0.newIndex,
      IP: x0 => x0.onLine,
      J: (s, p, i) => s.lastIndexOf(p, i),
      JB: x0 => new ArrayBuffer(x0),
      JC: (x0,x1) => x0.append(x1),
      JD: (x0,x1) => x0.contains(x1),
      JE: x0 => x0.preventDefault(),
      JF: s => s.toUpperCase(),
      JG: (o, m, a) => o[m].apply(o, a),
      JH: x0 => x0.selectionStart,
      JI: (x0,x1) => x0.getContext(x1),
      JJ: x0 => x0.localStorage,
      JK: (x0,x1) => x0.querySelectorAll(x1),
      JL: x0 => x0.phoneNumber,
      JM: x0 => x0.call(),
      JN: (x0,x1,x2,x3,x4,x5,x6,x7,x8) => new firebase_firestore.FieldPath(x0,x1,x2,x3,x4,x5,x6,x7,x8),
      JO: x0 => x0.oldIndex,
      JP: x0 => x0.extraAssets,
      K: (exn) => {
        if (exn instanceof Error) {
          return exn.stack;
        } else {
          return null;
        }
      },
      KB: (x0,x1,x2) => new Uint8Array(x0,x1,x2),
      KC: (x0,x1,x2,x3) => x0.setProperty(x1,x2,x3),
      KD: (decoder, codeUnits) => decoder.decode(codeUnits),
      KE: x0 => x0.parent,
      KF: x0 => x0.length,
      KG: x0 => x0.iterator,
      KH: x0 => x0.selectionEnd,
      KI: (x0,x1) => { x0.height = x1 },
      KJ: () => globalThis.window,
      KK: (x0,x1) => x0.item(x1),
      KL: x0 => x0.lastSignInTime,
      KM: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      KN: (x0,x1,x2,x3,x4,x5,x6,x7,x8,x9) => new firebase_firestore.FieldPath(x0,x1,x2,x3,x4,x5,x6,x7,x8,x9),
      KO: x0 => x0.type,
      KP: x0 => x0.fontManifest,
      L: o => o === undefined,
      LB: (x0,x1,x2) => new DataView(x0,x1,x2),
      LC: x0 => x0.style,
      LD: () => new TextDecoder("utf-8", {fatal: true}),
      LE: x0 => x0.timeStamp,
      LF: x0 => x0.flags,
      LG: () => globalThis.Symbol,
      LH: (x0,x1) => { x0.name = x1 },
      LI: (x0,x1) => { x0.width = x1 },
      LJ: (x0,x1) => x0.key(x1),
      LK: x0 => x0.nonce,
      LL: x0 => x0.creationTime,
      LM: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      LN: () => globalThis.firebase_firestore.documentId(),
      LO: x0 => x0.docChanges(),
      LP: x0 => x0.assetManifest,
      M: o => String(o),
      MB: (o, p) => o[p],
      MC: x0 => x0.debugShowSemanticsNodes,
      MD: () => new TextDecoder("utf-8", {fatal: false}),
      ME: (x0,x1) => x0.hasAttribute(x1),
      MF: (a, s) => a.join(s),
      MG: (x0,x1) => new Intl.Segmenter(x0,x1),
      MH: (x0,x1) => { x0.placeholder = x1 },
      MI: (x0,x1) => x0.transferFromImageBitmap(x1),
      MJ: x0 => x0.length,
      MK: x0 => x0.length,
      ML: x0 => x0.metadata,
      MM: (x0,x1,x2) => x0.onIdTokenChanged(x1,x2),
      MN: (x0,x1) => new firebase_firestore.GeoPoint(x0,x1),
      MO: x0 => x0.docs,
      MP: x0 => x0.buildConfig,
      N: (c) =>
      queueMicrotask(() => dartInstance.exports.$invokeCallback(c)),
      NB: (o) => new DataView(o.buffer, o.byteOffset, o.byteLength),
      NC: o => o,
      ND: (a, i, v) => a[i] = v,
      NE: x0 => x0.type,
      NF: (x0,x1) => x0.error(x1),
      NG: x0 => x0.Segmenter,
      NH: (x0,x1) => { x0.autocomplete = x1 },
      NI: x0 => x0.height,
      NJ: (x0,x1,x2) => x0.setItem(x1,x2),
      NK: (x0,x1) => { x0.src = x1 },
      NL: x0 => x0.isAnonymous,
      NM: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      NN: x0 => globalThis.firebase_firestore.vector(x0),
      NO: x0 => globalThis.firebase_firestore.getDocs(x0),
      NP: x0 => x0.length,
      O: (x0,x1) => x0.didCreateEngineInitializer(x1),
      OB: Function.prototype.call.bind(Object.getOwnPropertyDescriptor(DataView.prototype, 'byteLength').get),
      OC: o => {
        if (o === undefined || o === null) return 0;
        if (typeof o === 'boolean') return 1;
        return 2;
      },
      OD: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI8ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      OE: (x0,x1) => x0.getModifierState(x1),
      OF: () => globalThis.console,
      OG: x0 => x0.buffer,
      OH: (x0,x1) => { x0.type = x1 },
      OI: x0 => x0.width,
      OJ: (x0,x1,x2,x3) => x0.replaceState(x1,x2,x3),
      OK: (x0,x1) => { x0.src = x1 },
      OL: x0 => x0.emailVerified,
      OM: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      ON: x0 => globalThis.firebase_firestore.Bytes.fromUint8Array(x0),
      OO: x0 => globalThis.firebase_firestore.getDocsFromServer(x0),
      OP: x0 => x0.getReader(),
      P: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      PB: o => o.byteOffset,
      PC: (x0,x1) => x0.warn(x1),
      PD: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI32ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      PE: x0 => x0.buttons,
      PF: s => s.trimRight(),
      PG: x0 => x0.wasmMemory,
      PH: (x0,x1) => { x0.name = x1 },
      PI: x0 => x0.rasterEndMilliseconds,
      PJ: x0 => x0.reload(),
      PK: (x0,x1) => { x0.defer = x1 },
      PL: x0 => x0.email,
      PM: (x0,x1,x2) => x0.onAuthStateChanged(x1,x2),
      PN: (x0,x1) => globalThis.firebase_firestore.doc(x0,x1),
      PO: x0 => globalThis.firebase_firestore.getDocsFromCache(x0),
      PP: x0 => x0.value,
      Q: (wasmFunction,f) => finalizeWrapper(f, function() { return wasmFunction(f,arguments.length) }),
      QB: o => o.buffer,
      QC: x0 => x0.console,
      QD: (s) => +s,
      QE: x0 => x0.ctrlKey,
      QF: x0 => x0.blur(),
      QG: () => globalThis.window._flutter_skwasmInstance,
      QH: (x0,x1) => { x0.placeholder = x1 },
      QI: x0 => x0.rasterStartMilliseconds,
      QJ: x0 => x0.search,
      QK: (x0,x1) => { x0.async = x1 },
      QL: x0 => x0.displayName,
      QM: x0 => x0.currentUser,
      QN: x0 => x0.commit(),
      QO: (x0,x1,x2) => globalThis.firebase_firestore.where(x0,x1,x2),
      QP: x0 => x0.done,
      R: (x0,x1) => ({initializeEngine: x0,autoStart: x1}),
      RB: Function.prototype.call.bind(DataView.prototype.getUint8),
      RC: () => globalThis.window,
      RD: s => {
        if (!/^\s*[+-]?(?:Infinity|NaN|(?:\.\d+|\d+(?:\.\d*)?)(?:[eE][+-]?\d+)?)\s*$/.test(s)) {
          return NaN;
        }
        return parseFloat(s);
      },
      RE: x0 => x0.getBoundingClientRect(),
      RF: x0 => x0.button,
      RG: () => new TextDecoder(),
      RH: (x0,x1) => { x0.scrollTop = x1 },
      RI: x0 => x0.imageBitmaps,
      RJ: x0 => x0.pathname,
      RK: (x0,x1) => x0.createElement(x1),
      RL: x0 => globalThis.firebase_auth.multiFactor(x0),
      RM: x0 => x0.tenantId,
      RN: x0 => globalThis.firebase_firestore.writeBatch(x0),
      RO: (x0,x1) => globalThis.firebase_firestore.query(x0,x1),
      RP: x0 => x0.read(),
      S: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      SB: (b, o) => new DataView(b, o),
      SC: (o, c) => o instanceof c,
      SD: s => s.trim(),
      SE: x0 => x0.y,
      SF: (x0,x1) => x0.prepend(x1),
      SG: (map, o, v) => map.set(o, v),
      SH: (x0,x1,x2) => x0.setSelectionRange(x1,x2),
      SI: x0 => x0.canvasKitMaximumSurfaces,
      SJ: x0 => x0.history,
      SK: x0 => x0.trustedTypes,
      SL: x0 => x0.toJSON(),
      SM: x0 => x0.signOut(),
      SN: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      SO: () => globalThis.firebase_firestore.and,
      SP: x0 => x0.body,
      T: x0 => new Promise(x0),
      TB: (b, o, l) => new DataView(b, o, l),
      TC: (string, token) => string.split(token),
      TD: x0 => x0.classList,
      TE: x0 => x0.x,
      TF: x0 => x0.parentElement,
      TG: (map, o) => map.get(o),
      TH: (x0,x1,x2) => x0.setSelectionRange(x1,x2),
      TI: (a, i) => a.splice(i, 1),
      TJ: x0 => x0.location,
      TK: () => globalThis.console,
      TL: x0 => x0.user,
      TM: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      TN: x0 => ({maxAttempts: x0}),
      TO: () => globalThis.firebase_firestore.or,
      TP: (x0,x1) => new OffscreenCanvas(x0,x1),
      U: (x0,x1,x2) => x0.call(x1,x2),
      UB: Function.prototype.call.bind(DataView.prototype.getFloat64),
      UC: o => o instanceof Array,
      UD: x0 => x0.relatedTarget,
      UE: x0 => x0.top,
      UF: x0 => x0.innerHeight,
      UG: () => new WeakMap(),
      UH: s => {
        if (/[[\]{}()*+?.\\^$|]/.test(s)) {
            s = s.replace(/[[\]{}()*+?.\\^$|]/g, '\\$&');
        }
        return s;
      },
      UI: a => a.pop(),
      UJ: x0 => x0.sessionStorage,
      UK: x0 => x0.trustedTypes,
      UL: x0 => x0.idToken,
      UM: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      UN: (x0,x1,x2) => globalThis.firebase_firestore.runTransaction(x0,x1,x2),
      UO: x0 => globalThis.firebase_firestore.limitToLast(x0),
      UP: x0 => x0.assetBase,
      V: (constructor, args) => {
        const factoryFunction = constructor.bind.apply(
            constructor, [null, ...args]);
        return new factoryFunction();
      },
      VB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Float64Array) return 1;
        return 2;
      },
      VC: (a, i) => a[i],
      VD: x0 => x0.hasFocus(),
      VE: x0 => x0.left,
      VF: x0 => x0.innerWidth,
      VG: (d, digits) => d.toFixed(digits),
      VH: x0 => x0.keyCode,
      VI: x0 => new WeakRef(x0),
      VJ: x0 => x0.readText(),
      VK: (wasmFunction,f) => finalizeWrapper(f, function() { return wasmFunction(f,arguments.length) }),
      VL: x0 => x0.secret,
      VM: x0 => x0.hostname,
      VN: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      VO: x0 => globalThis.firebase_firestore.limit(x0),
      VP: x0 => x0.loader,
      W: x0 => new Array(x0),
      WB: Function.prototype.call.bind(DataView.prototype.setFloat64),
      WC: a => a.length,
      WD: x0 => x0.shiftKey,
      WE: x0 => x0.scrollTop,
      WF: x0 => x0.height,
      WG: x0 => x0.maxHeight,
      WH: (x0,x1) => x0.scrollIntoView(x1),
      WI: x0 => x0.deref(),
      WJ: x0 => x0.clipboard,
      WK: x0 => { globalThis.onGoogleLibraryLoad = x0 },
      WL: x0 => x0.accessToken,
      WM: x0 => x0.name,
      WN: (o,s,v) => o[s] = v,
      WO: () => globalThis.firebase_firestore.endBefore,
      WP: () => globalThis._flutter,
      X: o => [o],
      XB: (t, s) => t.set(s),
      XC: (x0,x1) => x0.test(x1),
      XD: x0 => x0.body,
      XE: x0 => x0.offsetTop,
      XF: x0 => x0.width,
      XG: x0 => x0.maxWidth,
      XH: x0 => x0.multiViewEnabled,
      XI: () => globalThis.WeakRef,
      XJ: x0 => x0.navigator,
      XK: (x0,x1,x2) => x0.setAttribute(x1,x2),
      XL: x0 => x0.signInMethod,
      XM: x0 => x0.token,
      XN: () => Symbol("jsBoxedDartObjectProperty"),
      XO: () => globalThis.firebase_firestore.endAt,
      Y: (o0, o1) => [o0, o1],
      YB: Function.prototype.call.bind(DataView.prototype.setFloat32),
      YC: x0 => x0.userAgent,
      YD: x0 => x0.visibilityState,
      YE: x0 => x0.scrollLeft,
      YF: x0 => x0.clientHeight,
      YG: x0 => x0.minHeight,
      YH: (x0,x1) => x0.replaceWith(x1),
      YI: () => new AbortController(),
      YJ: (x0,x1) => x0.getItem(x1),
      YK: (x0,x1) => { x0.id = x1 },
      YL: x0 => x0.providerId,
      YM: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      YN: x0 => ({serverTimestamps: x0}),
      YO: () => globalThis.firebase_firestore.startAfter,
      Z: (o0, o1, o2) => [o0, o1, o2],
      ZB: Function.prototype.call.bind(DataView.prototype.getFloat32),
      ZC: x0 => x0.navigator,
      ZD: (x0,x1,x2) => x0.removeEventListener(x1,x2),
      ZE: x0 => x0.offsetLeft,
      ZF: x0 => x0.clientWidth,
      ZG: x0 => x0.minWidth,
      ZH: (x0,x1) => { x0.className = x1 },
      ZI: (x0,x1,x2,x3,x4,x5) => ({method: x0,headers: x1,body: x2,credentials: x3,redirect: x4,signal: x5}),
      ZJ: x0 => ({name: x0}),
      ZK: x0 => globalThis.Intl.supportedValuesOf(x0),
      ZL: x0 => globalThis.firebase_auth.OAuthProvider.credentialFromResult(x0),
      ZM: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      ZN: x0 => x0.fromCache,
      ZO: () => globalThis.firebase_firestore.startAt,
      a: (o0, o1, o2, o3) => [o0, o1, o2, o3],
      aB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Float32Array) return 1;
        return 2;
      },
      aC: Function.prototype.call.bind(String.prototype.toLowerCase),
      aD: x0 => x0.disconnect(),
      aE: x0 => x0.offsetParent,
      aF: x0 => x0.isConnected,
      aG: x0 => x0.debugSkipFontRetryDelay,
      aH: (x0,x1) => { x0.tabIndex = x1 },
      aI: (x0,x1) => globalThis.fetch(x0,x1),
      aJ: (x0,x1) => x0.query(x1),
      aK: () => globalThis.Intl.DateTimeFormat(),
      aL: x0 => x0.username,
      aM: (x0,x1,x2) => globalThis.firebase_app_check.onTokenChanged(x0,x1,x2),
      aN: x0 => x0.hasPendingWrites,
      aO: (x0,x1) => globalThis.firebase_firestore.orderBy(x0,x1),
      b: (x0,x1,x2) => { x0[x1] = x2 },
      bB: Function.prototype.call.bind(DataView.prototype.getUint32),
      bC: Object.is,
      bD: x0 => new Intl.Locale(x0),
      bE: x0 => x0.offsetY,
      bF: x0 => x0.head,
      bG: x0 => x0.status,
      bH: (x0,x1) => { x0.action = x1 },
      bI: (x0,x1) => x0.get(x1),
      bJ: x0 => x0.state,
      bK: x0 => x0.resolvedOptions(),
      bL: x0 => x0.providerId,
      bM: x0 => new firebase_app_check.ReCaptchaV3Provider(x0),
      bN: x0 => x0.metadata,
      bO: x0 => x0.path,
      c: o => o,
      cB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Uint32Array) return 1;
        return 2;
      },
      cC: x0 => x0.vendor,
      cD: x0 => x0.region,
      cE: x0 => x0.offsetX,
      cF: (x0,x1) => { x0.content = x1 },
      cG: (x0,x1,x2) => x0.set(x1,x2),
      cH: (x0,x1) => { x0.method = x1 },
      cI: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1,x2) { return wasmFunction(f,arguments.length,x0,x1,x2) }),
      cJ: x0 => x0.permissions,
      cK: x0 => x0.timeZone,
      cL: x0 => x0.profile,
      cM: x0 => new firebase_app_check.ReCaptchaEnterpriseProvider(x0),
      cN: x0 => x0.toArray(),
      cO: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      d: (o, p) => o[p],
      dB: Function.prototype.call.bind(DataView.prototype.getInt32),
      dC: (x0,x1) => x0.createTextNode(x1),
      dD: x0 => x0.script,
      dE: (o, p, r) => o.replace(p, () => r),
      dF: (x0,x1) => { x0.name = x1 },
      dG: x0 => x0.arrayBuffer(),
      dH: (x0,x1) => { x0.noValidate = x1 },
      dI: (x0,x1) => x0.forEach(x1),
      dJ: x0 => x0.hostElement,
      dK: (x0,x1) => { x0.defaultConfig = x1 },
      dL: x0 => x0.isNewUser,
      dM: x0 => ({provider: x0}),
      dN: x0 => x0.toUint8Array(),
      dO: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      e: () => globalThis,
      eB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Int32Array) return 1;
        return 2;
      },
      eC: (x0,x1) => { x0.id = x1 },
      eD: x0 => x0.language,
      eE: (x0,x1) => { x0.lastIndex = x1 },
      eF: (x0,x1) => x0.removeChild(x1),
      eG: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof ArrayBuffer) return 1;
        if (globalThis.SharedArrayBuffer !== undefined &&
            o instanceof SharedArrayBuffer) {
          return 2;
        }
        return 3;
      },
      eH: x0 => x0.click(),
      eI: x0 => x0.name,
      eJ: x0 => x0.location,
      eK: x0 => globalThis.firebase_remote_config.getRemoteConfig(x0),
      eL: x0 => globalThis.firebase_auth.getAdditionalUserInfo(x0),
      eM: (x0,x1) => globalThis.firebase_app_check.initializeAppCheck(x0,x1),
      eN: () => globalThis.firebase_firestore.Bytes,
      eO: (x0,x1) => globalThis.firebase_firestore.collection(x0,x1),
      f: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      fB: o => o instanceof Uint16Array,
      fC: (x0,x1) => { x0.nonce = x1 },
      fD: x0 => x0.languages,
      fE: (s, m) => {
        try {
          return new RegExp(s, m);
        } catch (e) {
          return String(e);
        }
      },
      fF: x0 => x0.firstChild,
      fG: (x0,x1) => x0.fetch(x1),
      fH: (x0,x1) => x0.getElementsByClassName(x1),
      fI: x0 => x0.statusText,
      fJ: (x0,x1) => x0.getModifierState(x1),
      fK: x0 => globalThis.firebase_core.getApp(x0),
      fL: x0 => globalThis.firebase_auth.OAuthProvider.credentialFromError(x0),
      fM: (o, p, v) => o[p] = v,
      fN: () => globalThis.firebase_firestore.VectorValue,
      fO: x0 => x0.measurementId,
      g: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      gB: Function.prototype.call.bind(DataView.prototype.getUint16),
      gC: x0 => x0.nonce,
      gD: (x0,x1) => x0.observe(x1),
      gE: o => o instanceof RegExp,
      gF: x0 => x0.viewConstraints,
      gG: x0 => x0.fontFallbackBaseUrl,
      gH: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmF32ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      gI: x0 => x0.url,
      gJ: x0 => x0.metaKey,
      gK: () => globalThis.firebase_core.getApp(),
      gL: x0 => x0.session,
      gM: (x0,x1) => ({timeout: x0,limitedUseAppCheckTokens: x1}),
      gN: x0 => x0.longitude,
      gO: x0 => x0.appId,
      h: (x0,x1) => ({addView: x0,removeView: x1}),
      hB: o => o instanceof Int16Array,
      hC: () => globalThis.window.flutterConfiguration,
      hD: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      hE: x0 => x0.dotAll,
      hF: x0 => x0.hostElement,
      hG: (handle) => clearInterval(handle),
      hH: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmF64ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      hI: x0 => x0.status,
      hJ: x0 => x0.altKey,
      hK: (x0,x1) => { x0.fetchTimeoutMillis = x1 },
      hL: x0 => x0.phoneNumber,
      hM: (o, t) => typeof o === t,
      hN: x0 => x0.latitude,
      hO: x0 => x0.messagingSenderId,
      i: (l, r) => l === r,
      iB: Function.prototype.call.bind(DataView.prototype.getInt16),
      iC: (x0,x1) => x0.attachShadow(x1),
      iD: x0 => new ResizeObserver(x0),
      iE: x0 => x0.unicode,
      iF: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      iG: (ms, c) =>
      setInterval(() => dartInstance.exports.$invokeCallback(c), ms),
      iH: (x0,x1) => x0.dispatchEvent(x1),
      iI: x0 => x0.getReader(),
      iJ: x0 => x0.ctrlKey,
      iK: (x0,x1) => { x0.minimumFetchIntervalMillis = x1 },
      iL: x0 => x0.uid,
      iM: x0 => x0.data,
      iN: () => globalThis.firebase_firestore.GeoPoint,
      iO: x0 => x0.authDomain,
      j: x0 => x0.random(),
      jB: o => o instanceof Uint8ClampedArray,
      jC: (x0,x1) => x0.createElement(x1),
      jD: (x0,x1) => x0.getPropertyValue(x1),
      jE: x0 => x0.ignoreCase,
      jF: x0 => ({runApp: x0}),
      jG: () => Date.now(),
      jH: (x0,x1) => x0.createEvent(x1),
      jI: x0 => x0.read(),
      jJ: x0 => x0.isComposing,
      jK: x0 => x0.settings,
      jL: x0 => x0.enrollmentTime,
      jM: (x0,x1,x2) => globalThis.firebase_functions.httpsCallable(x0,x1,x2),
      jN: (x0,x1) => x0.data(x1),
      jO: x0 => x0.projectId,
      k: o => o,
      kB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Uint8Array) return 1;
        return 2;
      },
      kC: x0 => x0.scale,
      kD: x0 => globalThis.parseFloat(x0),
      kE: x0 => x0.multiline,
      kF: Function.prototype.call.bind(DataView.prototype.setBigInt64),
      kG: (x0,x1,x2,x3) => x0.pushState(x1,x2,x3),
      kH: (x0,x1,x2,x3) => x0.initEvent(x1,x2,x3),
      kI: x0 => x0.value,
      kJ: x0 => x0.code,
      kK: x0 => globalThis.firebase_remote_config.fetchAndActivate(x0),
      kL: x0 => x0.factorId,
      kM: (x0,x1) => globalThis.firebase_functions.httpsCallable(x0,x1),
      kN: x0 => x0.nanoseconds,
      kO: (x0,x1,x2,x3,x4,x5,x6,x7) => ({apiKey: x0,authDomain: x1,databaseURL: x2,projectId: x3,storageBucket: x4,messagingSenderId: x5,measurementId: x6,appId: x7}),
      l: o => {
        if (o === undefined || o === null) return 0;
        if (typeof o === 'number') return 1;
        return 2;
      },
      lB: Function.prototype.call.bind(DataView.prototype.setInt32),
      lC: x0 => x0.visualViewport,
      lD: (x0,x1) => x0.getComputedStyle(x1),
      lE: (o, p, r) => o.replaceAll(p, () => r),
      lF: (o, start, length) => new BigInt64Array(o.buffer, o.byteOffset + start, length),
      lG: x0 => x0.history,
      lH: x0 => x0.readText(),
      lI: x0 => x0.done,
      lJ: x0 => x0.repeat,
      lK: x0 => x0.getUpdatedKeys(),
      lL: x0 => x0.displayName,
      lM: (x0,x1) => globalThis.firebase_functions.getFunctions(x0,x1),
      lN: x0 => x0.seconds,
      lO: (x0,x1) => globalThis.firebase_core.initializeApp(x0,x1),
      m: () => globalThis.Math,
      mB: Function.prototype.call.bind(DataView.prototype.setUint32),
      mC: x0 => x0.devicePixelRatio,
      mD: x0 => x0.documentElement,
      mE: x0 => x0.deltaMode,
      mF: Function.prototype.call.bind(DataView.prototype.getBigInt64),
      mG: x0 => x0.search,
      mH: x0 => x0.clipboard,
      mI: x0 => x0.cancel(),
      mJ: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      mK: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1,x2) { return wasmFunction(f,arguments.length,x0,x1,x2) }),
      mL: x0 => x0.hints,
      mM: x0 => globalThis.firebase_firestore.memoryLocalCache(x0),
      mN: () => globalThis.firebase_firestore.Timestamp,
      mO: x0 => globalThis.firebase_core.initializeApp(x0),
      n: (x0,x1,x2,x3) => x0.addEventListener(x1,x2,x3),
      nB: Function.prototype.call.bind(DataView.prototype.setInt16),
      nC: x0 => x0.height,
      nD: x0 => x0.computedStyleMap(),
      nE: x0 => x0.deltaY,
      nF: () => typeof dartUseDateNowForTicks !== "undefined",
      nG: x0 => x0.location,
      nH: (x0,x1) => x0.writeText(x1),
      nI: x0 => x0.body,
      nJ: (x0,x1) => x0.canShare(x1),
      nK: (x0,x1) => x0.forEach(x1),
      nL: x0 => x0.tenantId,
      nM: () => globalThis.firebase_firestore.persistentMultipleTabManager(),
      nN: () => globalThis.firebase_firestore.DocumentReference,
      nO: x0 => x0.storageBucket,
      o: b => !!b,
      oB: Function.prototype.call.bind(DataView.prototype.setUint16),
      oC: x0 => x0.width,
      oD: (x0,x1) => x0.get(x1),
      oE: x0 => x0.deltaX,
      oF: () => Date.now(),
      oG: x0 => x0.pathname,
      oH: x0 => x0.unlock(),
      oI: x0 => x0.headers,
      oJ: (x0,x1) => x0.share(x1),
      oK: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      oL: x0 => x0.phoneNumber,
      oM: (x0,x1) => ({cacheSizeBytes: x0,tabManager: x1}),
      oN: x0 => x0.path,
      oO: x0 => x0.databaseURL,
      p: () => globalThis.document,
      pB: Function.prototype.call.bind(DataView.prototype.setUint8),
      pC: x0 => x0.screen,
      pD: (o, p) => p in o,
      pE: x0 => x0.wheelDeltaY,
      pF: () => 1000 * performance.now(),
      pG: (x0,x1,x2,x3) => x0.replaceState(x1,x2,x3),
      pH: (x0,x1) => x0.lock(x1),
      pI: x0 => x0.signal,
      pJ: x0 => x0.message,
      pK: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      pL: x0 => x0.email,
      pM: x0 => ({cacheSizeBytes: x0}),
      pN: x0 => x0.ref,
      pO: x0 => x0.apiKey,
      q: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      qB: Function.prototype.call.bind(DataView.prototype.setInt8),
      qC: (string, times) => string.repeat(times),
      qD: (x0,x1) => { x0.textContent = x1 },
      qE: x0 => x0.wheelDeltaX,
      qF: (x0,x1) => x0.requestAnimationFrame(x1),
      qG: o => {
        const proto = Object.getPrototypeOf(o);
        return proto === Object.prototype || proto === null;
      },
      qH: x0 => x0.orientation,
      qI: x0 => x0.abort(),
      qJ: (x0,x1,x2,x3) => x0.open(x1,x2,x3),
      qK: (x0,x1) => ({error: x0,next: x1}),
      qL: (x0,x1) => globalThis.firebase_auth.getMultiFactorResolver(x0,x1),
      qM: x0 => globalThis.firebase_firestore.persistentLocalCache(x0),
      qN: (x0,x1) => x0.get(x1),
      qO: x0 => x0.options,
      r: (x0,x1) => x0.focus(x1),
      rB: Function.prototype.call.bind(DataView.prototype.getInt8),
      rC: o => {
        if (o === null || o === undefined) return 0;
        if (typeof(o) === 'string') return 1;
        return 2;
      },
      rD: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      rE: x0 => x0.bottom,
      rF: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      rG: o => Object.keys(o),
      rH: (x0,x1) => x0.querySelector(x1),
      rI: x0 => x0.message,
      rJ: (x0,x1) => ({files: x0,text: x1}),
      rK: (x0,x1) => globalThis.firebase_remote_config.onConfigUpdate(x0,x1),
      rL: x0 => x0.customData,
      rM: (x0,x1,x2,x3) => ({ignoreUndefinedProperties: x0,experimentalForceLongPolling: x1,experimentalAutoDetectLongPolling: x2,localCache: x3}),
      rN: () => globalThis.firebase_firestore.updateDoc,
      rO: () => globalThis.firebase_core.SDK_VERSION,
      s: () => ({}),
      sB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Int8Array) return 1;
        return 2;
      },
      sC: x0 => x0.tabIndex,
      sD: x0 => x0.matches,
      sE: x0 => x0.right,
      sF: x0 => x0.now(),
      sG: x0 => x0.state,
      sH: (x0,x1) => { x0.title = x1 },
      sI: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      sJ: x0 => ({files: x0}),
      sK: x0 => globalThis.firebase_remote_config.activate(x0),
      sL: x0 => x0.message,
      sM: x0 => globalThis.firebase_firestore.waitForPendingWrites(x0),
      sN: x0 => globalThis.firebase_firestore.getDoc(x0),
      sO: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      t: (o, p, v) => o[p] = v,
      tB: (o, start, length) => new Float64Array(o.buffer, o.byteOffset + start, length),
      tC: (x0,x1) => x0.contains(x1),
      tD: (x0,x1) => x0.matchMedia(x1),
      tE: x0 => x0.clientY,
      tF: x0 => x0.performance,
      tG: x0 => x0.hash,
      tH: (x0,x1) => x0.vibrate(x1),
      tI: (x0,x1,x2) => x0.removeEventListener(x1,x2),
      tJ: x0 => ({text: x0}),
      tK: (x0,x1) => globalThis.firebase_remote_config.getValue(x0,x1),
      tL: x0 => x0.code,
      tM: (x0,x1,x2) => globalThis.firebase_firestore.initializeFirestore(x0,x1,x2),
      tN: x0 => globalThis.firebase_firestore.getDocFromServer(x0),
      tO: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      u: () => [],
      uB: (o, start, length) => new Float32Array(o.buffer, o.byteOffset + start, length),
      uC: x0 => x0.activeElement,
      uD: x0 => x0.matches,
      uE: x0 => x0.clientX,
      uF: x0 => new Uint8Array(x0),
      uG: x0 => x0.state,
      uH: x0 => x0.content,
      uI: () => globalThis.document,
      uJ: x0 => x0.userAgent,
      uK: x0 => x0.asString(),
      uL: x0 => x0.code,
      uM: (x0,x1) => globalThis.firebase_firestore.getFirestore(x0,x1),
      uN: x0 => globalThis.firebase_firestore.getDocFromCache(x0),
      uO: (x0,x1) => ({createScript: x0,createScriptURL: x1}),
      v: (a, i) => a.push(i),
      vB: (o, start, length) => new Uint32Array(o.buffer, o.byteOffset + start, length),
      vC: x0 => x0.parentNode,
      vD: o => typeof o === 'function' && o[jsWrappedDartFunctionSymbol] === true,
      vE: x0 => x0.changedTouches,
      vF: (x0,x1,x2) => x0.slice(x1,x2),
      vG: (x0,x1) => x0.go(x1),
      vH: x0 => x0.document,
      vI: (x0,x1,x2) => x0.addEventListener(x1,x2),
      vJ: x0 => x0.baseURI,
      vK: x0 => x0.getSource(),
      vL: x0 => x0.name,
      vM: x0 => globalThis.firebase_firestore.terminate(x0),
      vN: x0 => x0.source,
      vO: (x0,x1) => x0.createScriptURL(x1),
      w: x0 => new Int8Array(x0),
      wB: (o, start, length) => new Int32Array(o.buffer, o.byteOffset + start, length),
      wC: x0 => x0.tagName,
      wD: f => f.dartFunction,
      wE: x0 => x0.key,
      wF: (x0,x1) => x0.decode(x1),
      wG: (x0,x1) => x0.querySelectorAll(x1),
      wH: (x0,x1,x2) => x0.insertBefore(x1,x2),
      wI: (x0,x1) => x0.getData(x1),
      wJ: x0 => x0.document,
      wK: (x0,x1,x2) => globalThis.firebase_core.registerVersion(x0,x1,x2),
      wL: (x0,x1) => globalThis.firebase_auth.signInWithPopup(x0,x1),
      wM: x0 => globalThis.firebase_firestore.clearIndexedDbPersistence(x0),
      wN: x0 => ({source: x0}),
      wO: (x0,x1,x2) => x0.createScript(x1,x2),
      x: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI8ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      xB: (o, start, length) => new Uint16Array(o.buffer, o.byteOffset + start, length),
      xC: x0 => x0.target,
      xD: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      xE: x0 => x0.identifier,
      xF: (x0,x1) => x0.adoptText(x1),
      xG: (x0,x1) => x0.removeProperty(x1),
      xH: x0 => x0.id,
      xI: x0 => x0.clipboardData,
      xJ: () => {
        return typeof process != "undefined" &&
               Object.prototype.toString.call(process) == "[object process]" &&
               process.platform == "win32"
      },
      xK: (x0,x1) => globalThis.firebase_auth.linkWithCredential(x0,x1),
      xL: (x0,x1) => x0.setCustomParameters(x1),
      xM: (x0,x1) => new firebase_firestore.Timestamp(x0,x1),
      xN: (x0,x1,x2) => globalThis.firebase_firestore.setDoc(x0,x1,x2),
      xO: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      y: x0 => new Uint8Array(x0),
      yB: (o, start, length) => new Int16Array(o.buffer, o.byteOffset + start, length),
      yC: x0 => x0.clientY,
      yD: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      yE: x0 => x0.touches,
      yF: x0 => x0.first(),
      yG: (x0,x1) => x0.add(x1),
      yH: x0 => x0.offsetHeight,
      yI: x0 => x0.composedPath(),
      yJ: () => {
        // On browsers return `globalThis.location.href`
        if (globalThis.location != null) {
          return globalThis.location.href;
        }
        return null;
      },
      yK: (x0,x1,x2) => ({accessToken: x0,idToken: x1,rawNonce: x2}),
      yL: (x0,x1) => x0.addScope(x1),
      yM: (wasmFunction,f) => finalizeWrapper(f, function() { return wasmFunction(f,arguments.length) }),
      yN: (x0,x1) => globalThis.firebase_firestore.setDoc(x0,x1),
      yO: (o, p) => delete o[p],
      z: x0 => new Uint8ClampedArray(x0),
      zB: (o, start, length) => new Uint8ClampedArray(o.buffer, o.byteOffset + start, length),
      zC: x0 => x0.clientX,
      zD: (p, s, f) => p.then(s, (e) => f(e, e === undefined)),
      zE: x0 => x0.pressure,
      zF: x0 => x0.next(),
      zG: x0 => x0.data,
      zH: x0 => x0.offsetWidth,
      zI: x0 => x0.isContentEditable,
      zJ: (x0,x1) => x0.querySelector(x1),
      zK: (x0,x1) => x0.credential(x1),
      zL: () => new firebase_auth.GoogleAuthProvider(),
      zM: () => globalThis.firebase_firestore.deleteField(),
      zN: x0 => ({merge: x0}),
      zO: (x0,x1) => { x0.text = x1 },

    };

    const baseImports = {
      _: dart2wasm,
      Math: Math,
      Date: Date,
      Object: Object,
      Array: Array,
      Reflect: Reflect,
      WebAssembly: {
        JSTag: WebAssembly.JSTag,
      },
      "": new Proxy({}, { get(_, prop) { return prop; } }),

    };

    

    dartInstance = await WebAssembly.instantiate(this.module, {
      ...baseImports,
      ...additionalImports,
      
    });

    return new InstantiatedApp(this, dartInstance);
  }
}

class InstantiatedApp {
  constructor(compiledApp, instantiatedModule) {
    this.compiledApp = compiledApp;
    this.instantiatedModule = instantiatedModule;
  }

  // Call the main function with the given arguments.
  invokeMain(...args) {
    this.instantiatedModule.exports.$invokeMain(args);
  }
}
