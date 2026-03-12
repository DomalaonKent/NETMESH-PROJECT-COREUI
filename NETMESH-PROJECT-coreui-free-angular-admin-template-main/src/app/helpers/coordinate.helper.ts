export interface CoordinateResult {
  lat: number | null;
  lng: number | null;
  error: string | null;
}

export function parseCoordinates(
  rawLat: string | number,
  rawLng: string | number
): CoordinateResult {
  const latStr = String(rawLat).trim();
  const lngStr = String(rawLng).trim();

  if (!latStr || !lngStr) {
    return { lat: null, lng: null, error: 'Latitude and longitude are required.' };
  }

  const lat = parseFloat(latStr);
  const lng = parseFloat(lngStr);

  if (isNaN(lat) || isNaN(lng)) {
    return {
      lat: null, lng: null,
      error: `Invalid format. Coordinates must be decimal numbers (e.g. 13.62, 123.18). Got: lat="${rawLat}", lng="${rawLng}".`
    };
  }

  if (lat < -90 || lat > 90) {
    return { lat: null, lng: null, error: `Latitude out of range. Must be between -90 and 90. Got: ${lat}.` };
  }

  if (lng < -180 || lng > 180) {
    return { lat: null, lng: null, error: `Longitude out of range. Must be between -180 and 180. Got: ${lng}.` };
  }

  return { lat, lng, error: null };
}

export const REGION_GEO: Record<string, [number, number, number]> = {
  'NCR - Metro Manila':              [14.5995, 120.9842, 11],
  'CAR - Cordillera':                [17.3513, 121.1720,  9],
  'Region I - Ilocos Region':        [16.0832, 120.6200,  9],
  'Region II - Cagayan Valley':      [17.6132, 121.7270,  8],
  'Region III - Central Luzon':      [15.4755, 120.5960,  9],
  'Region IV-A - CALABARZON':        [14.1008, 121.0794,  9],
  'Region IV-B - MIMAROPA':          [11.5000, 120.7167,  8],
  'Region V - Bicol Region':         [13.4213, 123.4136,  9],
  'Region VI - Western Visayas':     [10.9197, 122.5840,  9],
  'Region VII - Central Visayas':    [10.3157, 123.8854,  9],
  'Region VIII - Eastern Visayas':   [11.2437, 124.9885,  9],
  'Region IX - Zamboanga Peninsula': [ 8.1527, 123.2577,  9],
  'Region X - Northern Mindanao':    [ 8.0000, 124.6856,  9],
  'Region XI - Davao Region':        [ 7.3000, 125.6833,  9],
  'Region XII - SOCCSKSARGEN':       [ 6.2700, 124.6860,  9],
  'Region XIII - Caraga':            [ 8.9456, 125.5456,  9],
  'BARMM':                           [ 6.9214, 124.1575,  8],
};

export const PROVINCE_GEO: Record<string, [number, number, number]> = {
  'Metro Manila':          [14.5995, 120.9842, 12],
  'Abra':                  [17.5951, 120.7983, 10],
  'Apayao':                [18.0118, 121.1721, 10],
  'Benguet':               [16.4023, 120.5960, 10],
  'Ifugao':                [16.8330, 121.1710, 10],
  'Kalinga':               [17.4643, 121.3590, 10],
  'Mountain Province':     [17.0000, 121.0000, 10],
  'Ilocos Norte':          [18.1980, 120.7137, 10],
  'Ilocos Sur':            [17.5760, 120.3870, 10],
  'La Union':              [16.6159, 120.3209, 10],
  'Pangasinan':            [15.8949, 120.2863, 10],
  'Batanes':               [20.4487, 121.9702, 10],
  'Cagayan':               [18.2490, 121.8770, 10],
  'Isabela':               [16.9754, 121.8107, 10],
  'Nueva Vizcaya':         [16.3301, 121.1710, 10],
  'Quirino':               [16.2700, 121.5370, 10],
  'Aurora':                [15.9784, 121.6476, 10],
  'Bataan':                [14.6416, 120.4818, 10],
  'Bulacan':               [14.7942, 120.8799, 10],
  'Nueva Ecija':           [15.5784, 121.0687, 10],
  'Pampanga':              [15.0794, 120.6200, 10],
  'Tarlac':                [15.4755, 120.5960, 10],
  'Zambales':              [15.5082, 119.9697, 10],
  'Batangas':              [13.7565, 121.0583, 10],
  'Cavite':                [14.2456, 120.8786, 10],
  'Laguna':                [14.1697, 121.4115, 10],
  'Quezon':                [14.0313, 122.1116, 10],
  'Rizal':                 [14.6037, 121.3084, 10],
  'Marinduque':            [13.4767, 121.9032, 11],
  'Occidental Mindoro':    [13.1024, 120.7651, 10],
  'Oriental Mindoro':      [13.0565, 121.4070, 10],
  'Palawan':               [ 9.8349, 118.7384,  8],
  'Romblon':               [12.5778, 122.2695, 10],
  'Albay':                 [13.1748, 123.5280, 11],
  'Camarines Norte':       [14.1389, 122.7632, 10],
  'Camarines Sur':         [13.6252, 123.1829, 10],
  'Catanduanes':           [13.7089, 124.2422, 11],
  'Masbate':               [12.3696, 123.6175, 10],
  'Sorsogon':              [12.9433, 124.0042, 11],
  'Aklan':                 [11.8166, 122.0942, 10],
  'Antique':               [11.3652, 122.0965, 10],
  'Capiz':                 [11.5527, 122.7391, 10],
  'Guimaras':              [10.5986, 122.6289, 11],
  'Iloilo':                [10.6969, 122.5644, 10],
  'Negros Occidental':     [10.6713, 123.0036, 10],
  'Bohol':                 [ 9.8349, 124.4330, 10],
  'Cebu':                  [10.3157, 123.8854, 10],
  'Negros Oriental':       [ 9.6301, 122.9832, 10],
  'Siquijor':              [ 9.2000, 123.5167, 11],
  'Biliran':               [11.5833, 124.4667, 11],
  'Eastern Samar':         [11.6500, 125.4000, 10],
  'Leyte':                 [10.8700, 124.8810, 10],
  'Northern Samar':        [12.3619, 124.7739, 10],
  'Samar':                 [11.7943, 124.9897, 10],
  'Southern Leyte':        [10.3353, 125.1717, 10],
  'Zamboanga del Norte':   [ 8.3884, 123.1600, 10],
  'Zamboanga del Sur':     [ 7.8383, 123.2966, 10],
  'Zamboanga Sibugay':     [ 7.5222, 122.8198, 10],
  'Bukidnon':              [ 8.0515, 125.0985, 10],
  'Camiguin':              [ 9.1700, 124.7220, 11],
  'Lanao del Norte':       [ 8.0730, 124.2873, 10],
  'Misamis Occidental':    [ 8.3375, 123.7071, 10],
  'Misamis Oriental':      [ 8.5069, 124.6219, 10],
  'Davao de Oro':          [ 7.5161, 126.1748, 10],
  'Davao del Norte':       [ 7.5700, 125.6500, 10],
  'Davao del Sur':         [ 6.8260, 125.2090, 10],
  'Davao Occidental':      [ 6.1000, 125.6000, 10],
  'Davao Oriental':        [ 7.5036, 126.5429, 10],
  'Cotabato':              [ 7.2047, 124.2310, 10],
  'Sarangani':             [ 5.9269, 125.1921, 10],
  'South Cotabato':        [ 6.3358, 124.7679, 10],
  'Sultan Kudarat':        [ 6.7059, 124.2519, 10],
  'Agusan del Norte':      [ 8.9456, 125.5323, 10],
  'Agusan del Sur':        [ 8.1635, 126.0144, 10],
  'Dinagat Islands':       [10.1280, 125.6009, 10],
  'Surigao del Norte':     [ 9.8094, 125.4822, 10],
  'Surigao del Sur':       [ 8.7507, 126.1371, 10],
  'Basilan':               [ 6.4228, 122.0371, 11],
  'Lanao del Sur':         [ 7.8231, 124.4198, 10],
  'Maguindanao del Norte': [ 7.1907, 124.2951, 10],
  'Maguindanao del Sur':   [ 6.8026, 124.4198, 10],
  'Sulu':                  [ 5.9749, 121.0339, 10],
  'Tawi-Tawi':             [ 5.1339, 119.9518, 10],
};

export const CITY_GEO: Record<string, [number, number, number]> = {

  // NCR 
  'Manila':          [14.5995, 120.9842, 13],
  'Quezon City':     [14.6760, 121.0437, 13],
  'Makati':          [14.5547, 121.0244, 13],
  'Makati City':     [14.5547, 121.0244, 13],
  'Taguig':          [14.5243, 121.0792, 13],
  'Taguig City':     [14.5243, 121.0792, 13],
  'Pasig':           [14.5764, 121.0851, 13],
  'Pasig City':      [14.5764, 121.0851, 13],
  'Pasay':           [14.5378, 120.9983, 13],
  'Pasay City':      [14.5378, 120.9983, 13],
  'Mandaluyong':     [14.5794, 121.0359, 13],
  'Marikina':        [14.6507, 121.1029, 13],
  'Marikina City':   [14.6507, 121.1029, 13],
  'Paranaque':       [14.4793, 120.9908, 13],
  'Las Pinas':       [14.4453, 120.9829, 13],
  'Muntinlupa':      [14.4081, 121.0415, 13],
  'Valenzuela':      [14.7011, 120.9830, 13],
  'Caloocan':        [14.6500, 120.9667, 13],
  'Malabon':         [14.6681, 120.9572, 13],
  'Navotas':         [14.6667, 120.9426, 13],
  'San Juan':        [14.6019, 121.0355, 13],
  'San Juan City':   [14.6019, 121.0355, 13],

  // REGION I - Ilocos 
  'Laoag':           [18.1982, 120.5934, 13],
  'Laoag City':      [18.1982, 120.5934, 13],
  'Vigan':           [17.5747, 120.3869, 13],
  'Vigan City':      [17.5747, 120.3869, 13],
  'San Fernando':    [16.6159, 120.3209, 13],
  'Dagupan':         [16.0432, 120.3337, 13],
  'Dagupan City':    [16.0432, 120.3337, 13],
  'Alaminos':        [16.1554, 119.9808, 13],
  'Alaminos City':   [16.1554, 119.9808, 13],
  'San Carlos':      [15.9269, 120.3474, 13],
  'San Carlos City': [15.9269, 120.3474, 13],
  'Urdaneta':        [15.9761, 120.5711, 13],
  'Urdaneta City':   [15.9761, 120.5711, 13],

  // REGION II
  'Tuguegarao':      [17.6130, 121.7270, 13],
  'Tuguegarao City': [17.6130, 121.7270, 13],
  'Ilagan':          [17.1483, 121.8904, 13],
  'Ilagan City':     [17.1483, 121.8904, 13],
  'Santiago':        [16.6888, 121.5497, 13],
  'Santiago City':   [16.6888, 121.5497, 13],
  'Cauayan':         [16.9307, 121.7686, 13],
  'Cauayan City':    [16.9307, 121.7686, 13],

  // REGION III 
  'Angeles':         [15.1450, 120.5887, 13],
  'Angeles City':    [15.1450, 120.5887, 13],
  'Olongapo':        [14.8292, 120.2828, 13],
  'Olongapo City':   [14.8292, 120.2828, 13],
  'Cabanatuan':      [15.4864, 120.9688, 13],
  'Cabanatuan City': [15.4864, 120.9688, 13],
  'Malolos':         [14.8527, 120.8143, 13],
  'Malolos City':    [14.8527, 120.8143, 13],
  'Tarlac City':     [15.4755, 120.5960, 13],
  'Meycauayan':      [14.7344, 120.9605, 13],
  'Meycauayan City': [14.7344, 120.9605, 13],
  'Mabalacat':       [15.2165, 120.5773, 13],
  'Mabalacat City':  [15.2165, 120.5773, 13],
  'Palayan':         [15.5436, 121.0838, 13],
  'Palayan City':    [15.5436, 121.0838, 13],
  'Gapan':           [15.3068, 120.9469, 13],
  'Gapan City':      [15.3068, 120.9469, 13],
  'Munoz':           [15.7182, 120.9025, 13],
  'Science City of Munoz': [15.7182, 120.9025, 13],
  'Balanga':         [14.6761, 120.5360, 13],
  'Balanga City':    [14.6761, 120.5360, 13],

  // REGION IV-A 
  'Batangas City':   [13.7565, 121.0583, 13],
  'Lipa':            [13.9411, 121.1631, 13],
  'Lipa City':       [13.9411, 121.1631, 13],
  'Lucena':          [13.9373, 121.6170, 13],
  'Lucena City':     [13.9373, 121.6170, 13],
  'Antipolo':        [14.5870, 121.1760, 13],
  'Antipolo City':   [14.5870, 121.1760, 13],
  'Calamba':         [14.2127, 121.1656, 13],
  'Calamba City':    [14.2127, 121.1656, 13],
  'Santa Rosa':      [14.3122, 121.1114, 13],
  'Santa Rosa City': [14.3122, 121.1114, 13],
  'Bacoor':          [14.4580, 120.9658, 13],
  'Bacoor City':     [14.4580, 120.9658, 13],
  'Dasmarinas':      [14.3294, 120.9367, 13],
  'Dasmarinas City': [14.3294, 120.9367, 13],
  'Imus':            [14.4297, 120.9367, 13],
  'Imus City':       [14.4297, 120.9367, 13],
  'Cavite City':     [14.4791, 120.8971, 13],
  'Tagaytay':        [14.1053, 120.9621, 13],
  'Tagaytay City':   [14.1053, 120.9621, 13],
  'Trece Martires':  [14.2822, 120.8656, 13],
  'General Trias':   [14.3870, 120.8808, 13],
  'General Trias City': [14.3870, 120.8808, 13],
  'Binan':           [14.3396, 121.0817, 13],
  'Binan City':      [14.3396, 121.0817, 13],
  'San Pedro':       [14.3587, 121.0472, 13],
  'San Pedro City':  [14.3587, 121.0472, 13],
  'Cabuyao':         [14.2748, 121.1245, 13],
  'Cabuyao City':    [14.2748, 121.1245, 13],
  'San Pablo':       [14.0686, 121.3228, 13],
  'San Pablo City':  [14.0686, 121.3228, 13],
  'Tayabas':         [14.0228, 121.5930, 13],
  'Tayabas City':    [14.0228, 121.5930, 13],
  'Cainta':          [14.5787, 121.1219, 13],
  'Taytay':          [14.5619, 121.1324, 13],
  'Angono':          [14.5237, 121.1535, 13],

  // REGION IV-B
  'Puerto Princesa':      [ 9.7392, 118.7353, 12],
  'Puerto Princesa City': [ 9.7392, 118.7353, 12],
  'Calapan':              [13.4114, 121.1803, 13],
  'Calapan City':         [13.4114, 121.1803, 13],

  // REGION V
  'Naga':            [13.6192, 123.1814, 13],
  'Naga City':       [13.6192, 123.1814, 13],
  'Legazpi':         [13.1391, 123.7438, 13],
  'Legazpi City':    [13.1391, 123.7438, 13],
  'Sorsogon City':   [12.9733, 124.0036, 13],
  'Tabaco':          [13.3594, 123.7315, 13],
  'Tabaco City':     [13.3594, 123.7315, 13],
  'Ligao':           [13.2269, 123.5279, 13],
  'Ligao City':      [13.2269, 123.5279, 13],
  'Iriga':           [13.4231, 123.4085, 13],
  'Iriga City':      [13.4231, 123.4085, 13],
  'Daet':            [14.1115, 122.9551, 13],
  'Masbate City':    [12.3681, 123.6202, 13],
  'Virac':           [13.5803, 124.2354, 13],
  'Barcelona':       [12.8695, 124.1382, 13],
  'Bulan':           [12.6700, 123.8702, 13],
  'Bulusan':         [12.7484, 124.1320, 13],
  'Casiguran':       [12.8735, 124.0193, 13],
  'Castilla':        [12.9560, 123.8766, 13],
  'Donsol':          [12.9049, 123.5986, 13],
  'Gubat':           [12.9177, 124.1204, 13],
  'Irosin':          [12.7042, 124.0323, 13],
  'Juban':           [12.8434, 123.9908, 13],
  'Magallanes':      [12.8296, 123.8340, 13],
  'Matnog':          [12.5887, 124.0772, 13],
  'Pilar':           [12.9236, 123.6988, 13],
  'Prieto Diaz':     [13.0432, 124.1958, 13],
  'Santa Magdalena': [12.6555, 124.1136, 13],
  'Sta. Magdalena':  [12.6555, 124.1136, 13],
  'Bacacay':         [13.2942, 123.7890, 13],
  'Camalig':         [13.1720, 123.6543, 13],
  'Daraga':          [13.1578, 123.6939, 13],
  'Guinobatan':      [13.1827, 123.5930, 13],
  'Jovellar':        [13.0571, 123.5939, 13],
  'Libon':           [13.3008, 123.4554, 13],
  'Malilipot':       [13.2792, 123.7216, 13],
  'Malinao':         [13.4052, 123.6295, 13],
  'Manito':          [13.2392, 124.0051, 13],
  'Oas':             [13.2580, 123.5014, 13],
  'Pio Duran':       [13.0336, 123.5952, 13],
  'Polangui':        [13.2928, 123.4894, 13],
  'Rapu-Rapu':       [13.1823, 124.1460, 13],
  'Santo Domingo':   [13.2617, 123.7403, 13],
  'Tiwi':            [13.4530, 123.6751, 13],
  'Pili':            [13.5807, 123.2953, 13],
  'Libmanan':        [13.6937, 122.9876, 13],
  'Minalabac':       [13.5601, 123.1823, 13],
  'Ragay':           [13.8133, 122.7840, 13],
  'Sipocot':         [13.7692, 122.9761, 13],

  // REGION VI 
  'Iloilo City':     [10.6969, 122.5644, 13],
  'Bacolod':         [10.6767, 122.9570, 13],
  'Bacolod City':    [10.6767, 122.9570, 13],
  'Roxas City':      [11.5847, 122.7511, 13],
  'Kalibo':          [11.7057, 122.3636, 13],
  'Passi':           [11.1048, 122.6403, 13],
  'Passi City':      [11.1048, 122.6403, 13],
  'Silay':           [10.7966, 122.9736, 13],
  'Silay City':      [10.7966, 122.9736, 13],
  'Sagay':           [10.8942, 123.4228, 13],
  'Sagay City':      [10.8942, 123.4228, 13],
  'Cadiz':           [10.9571, 123.3044, 13],
  'Cadiz City':      [10.9571, 123.3044, 13],
  'Escalante':       [10.8392, 123.4997, 13],
  'Escalante City':  [10.8392, 123.4997, 13],
  'Himamaylan':      [10.1006, 122.8699, 13],
  'Himamaylan City': [10.1006, 122.8699, 13],
  'Kabankalan':      [ 9.9883, 122.8139, 13],
  'Kabankalan City': [ 9.9883, 122.8139, 13],
  'La Carlota':      [10.4227, 122.9225, 13],
  'La Carlota City': [10.4227, 122.9225, 13],
  'San Carlos City (Negros Occ)': [10.4936, 123.4100, 13],
  'Talisay':         [10.7417, 122.9695, 13],
  'Talisay City':    [10.7417, 122.9695, 13],
  'Victorias':       [10.9003, 123.0747, 13],
  'Victorias City':  [10.9003, 123.0747, 13],

  // REGION VII
  'Cebu City':       [10.3157, 123.8854, 13],
  'Mandaue':         [10.3236, 123.9220, 13],
  'Mandaue City':    [10.3236, 123.9220, 13],
  'Tagbilaran':      [ 9.6500, 123.8500, 13],
  'Tagbilaran City': [ 9.6500, 123.8500, 13],
  'Dumaguete':       [ 9.3068, 123.3054, 13],
  'Dumaguete City':  [ 9.3068, 123.3054, 13],
  'Lapu-Lapu':       [10.3103, 123.9494, 13],
  'Lapu-Lapu City':  [10.3103, 123.9494, 13],
  'Toledo':          [10.3771, 123.6386, 13],
  'Toledo City':     [10.3771, 123.6386, 13],
  'Danao':           [10.5215, 124.0266, 13],
  'Danao City':      [10.5215, 124.0266, 13],
  'Talisay (Negros Occ)':      [10.7417, 122.9695, 13],
  'Talisay City (Negros Occ)': [10.7417, 122.9695, 13],
  'Carcar':          [10.1073, 123.6413, 13],
  'Carcar City':     [10.1073, 123.6413, 13],
  'Naga City (Cebu)': [10.2122, 123.7571, 13],
  'Bogo':            [11.0537, 124.0054, 13],
  'Bogo City':       [11.0537, 124.0054, 13],
  'Bayawan':         [ 9.3692, 122.8045, 13],
  'Bayawan City':    [ 9.3692, 122.8045, 13],
  'Canlaon':         [10.3860, 123.1998, 13],
  'Canlaon City':    [10.3860, 123.1998, 13],
  'Guihulngan':      [10.1188, 123.2743, 13],
  'Guihulngan City': [10.1188, 123.2743, 13],

  // REGION VIII
  'Tacloban':        [11.2543, 125.0000, 13],
  'Tacloban City':   [11.2543, 125.0000, 13],
  'Ormoc':           [11.0067, 124.6076, 13],
  'Ormoc City':      [11.0067, 124.6076, 13],
  'Catbalogan':      [11.7752, 124.8854, 13],
  'Catbalogan City': [11.7752, 124.8854, 13],
  'Borongan':        [11.6079, 125.4325, 13],
  'Borongan City':   [11.6079, 125.4325, 13],
  'Calbayog':        [12.0728, 124.5952, 13],
  'Calbayog City':   [12.0728, 124.5952, 13],
  'Maasin':          [10.1348, 124.8449, 13],
  'Maasin City':     [10.1348, 124.8449, 13],
  'Baybay':          [10.6752, 124.8008, 13],
  'Baybay City':     [10.6752, 124.8008, 13],

  // REGION IX
  'Zamboanga City':  [ 6.9214, 122.0790, 12],
  'Pagadian':        [ 7.8278, 123.4365, 13],
  'Pagadian City':   [ 7.8278, 123.4365, 13],
  'Dipolog':         [ 8.5878, 123.3419, 13],
  'Dipolog City':    [ 8.5878, 123.3419, 13],
  'Dapitan':         [ 8.6554, 123.4235, 13],
  'Dapitan City':    [ 8.6554, 123.4235, 13],
  'Isabela City':    [ 6.7008, 121.9711, 13],

  // REGION X 
  'Cagayan de Oro':       [ 8.4542, 124.6319, 12],
  'Cagayan de Oro City':  [ 8.4542, 124.6319, 12],
  'Iligan':               [ 8.2280, 124.2452, 13],
  'Iligan City':          [ 8.2280, 124.2452, 13],
  'Ozamiz':               [ 8.1494, 123.8445, 13],
  'Ozamiz City':          [ 8.1494, 123.8445, 13],
  'Oroquieta':            [ 8.4857, 123.8060, 13],
  'Oroquieta City':       [ 8.4857, 123.8060, 13],
  'Valencia':             [ 7.9059, 125.0937, 13],
  'Valencia City':        [ 7.9059, 125.0937, 13],
  'El Salvador':          [ 8.5614, 124.5219, 13],
  'El Salvador City':     [ 8.5614, 124.5219, 13],
  'Gingoog':              [ 8.8228, 125.1106, 13],
  'Gingoog City':         [ 8.8228, 125.1106, 13],
  'Malaybalay':           [ 8.1575, 125.1278, 13],
  'Malaybalay City':      [ 8.1575, 125.1278, 13],
  'Tangub':               [ 8.0667, 123.7514, 13],
  'Tangub City':          [ 8.0667, 123.7514, 13],

  // REGION XI
  'Davao City':      [ 7.1907, 125.4553, 12],
  'Tagum':           [ 7.4478, 125.8078, 13],
  'Tagum City':      [ 7.4478, 125.8078, 13],
  'Digos':           [ 6.7497, 125.3570, 13],
  'Digos City':      [ 6.7497, 125.3570, 13],
  'Mati':            [ 6.9497, 126.2150, 13],
  'Mati City':       [ 6.9497, 126.2150, 13],
  'Panabo':          [ 7.3085, 125.6846, 13],
  'Panabo City':     [ 7.3085, 125.6846, 13],
  'Samal':           [ 7.0939, 125.7202, 13],
  'Island Garden City of Samal': [7.0939, 125.7202, 13],

  // REGION XII
  'General Santos':       [ 6.1164, 125.1716, 12],
  'General Santos City':  [ 6.1164, 125.1716, 12],
  'Koronadal':            [ 6.5034, 124.8442, 13],
  'Koronadal City':       [ 6.5034, 124.8442, 13],
  'Kidapawan':            [ 7.0083, 125.0892, 13],
  'Kidapawan City':       [ 7.0083, 125.0892, 13],
  'Tacurong':             [ 6.6929, 124.6764, 13],
  'Tacurong City':        [ 6.6929, 124.6764, 13],

  // REGION XIII 
  'Butuan':          [ 8.9475, 125.5406, 12],
  'Butuan City':     [ 8.9475, 125.5406, 12],
  'Surigao':         [ 9.7847, 125.4970, 13],
  'Surigao City':    [ 9.7847, 125.4970, 13],
  'Bislig':          [ 8.2132, 126.3219, 13],
  'Bislig City':     [ 8.2132, 126.3219, 13],
  'Bayugan':         [ 8.9509, 125.7453, 13],
  'Bayugan City':    [ 8.9509, 125.7453, 13],
  'Cabadbaran':      [ 9.1233, 125.5347, 13],
  'Cabadbaran City': [ 9.1233, 125.5347, 13],
  'Tandag':          [ 9.0722, 126.1972, 13],
  'Tandag City':     [ 9.0722, 126.1972, 13],

  // BARMM
  'Cotabato City':   [ 7.2047, 124.2310, 13],
  'Marawi':          [ 7.9986, 124.2928, 13],
  'Marawi City':     [ 7.9986, 124.2928, 13],
  'Lamitan':         [ 6.6570, 122.1313, 13],
  'Lamitan City':    [ 6.6570, 122.1313, 13],

  //  CAR 
  'Baguio':          [16.4023, 120.5960, 13],
  'Baguio City':     [16.4023, 120.5960, 13],
  'Tabuk':           [17.4189, 121.4443, 13],
  'Tabuk City':      [17.4189, 121.4443, 13],
};

export const REGION_PROVINCE_MAP: Record<string, string[]> = {
  'NCR - Metro Manila':              ['Metro Manila'],
  'CAR - Cordillera':                ['Abra', 'Apayao', 'Benguet', 'Ifugao', 'Kalinga', 'Mountain Province'],
  'Region I - Ilocos Region':        ['Ilocos Norte', 'Ilocos Sur', 'La Union', 'Pangasinan'],
  'Region II - Cagayan Valley':      ['Batanes', 'Cagayan', 'Isabela', 'Nueva Vizcaya', 'Quirino'],
  'Region III - Central Luzon':      ['Aurora', 'Bataan', 'Bulacan', 'Nueva Ecija', 'Pampanga', 'Tarlac', 'Zambales'],
  'Region IV-A - CALABARZON':        ['Batangas', 'Cavite', 'Laguna', 'Quezon', 'Rizal'],
  'Region IV-B - MIMAROPA':          ['Marinduque', 'Occidental Mindoro', 'Oriental Mindoro', 'Palawan', 'Romblon'],
  'Region V - Bicol Region':         ['Albay', 'Camarines Norte', 'Camarines Sur', 'Catanduanes', 'Masbate', 'Sorsogon'],
  'Region VI - Western Visayas':     ['Aklan', 'Antique', 'Capiz', 'Guimaras', 'Iloilo', 'Negros Occidental'],
  'Region VII - Central Visayas':    ['Bohol', 'Cebu', 'Negros Oriental', 'Siquijor'],
  'Region VIII - Eastern Visayas':   ['Biliran', 'Eastern Samar', 'Leyte', 'Northern Samar', 'Samar', 'Southern Leyte'],
  'Region IX - Zamboanga Peninsula': ['Zamboanga del Norte', 'Zamboanga del Sur', 'Zamboanga Sibugay'],
  'Region X - Northern Mindanao':    ['Bukidnon', 'Camiguin', 'Lanao del Norte', 'Misamis Occidental', 'Misamis Oriental'],
  'Region XI - Davao Region':        ['Davao de Oro', 'Davao del Norte', 'Davao del Sur', 'Davao Occidental', 'Davao Oriental'],
  'Region XII - SOCCSKSARGEN':       ['Cotabato', 'Sarangani', 'South Cotabato', 'Sultan Kudarat'],
  'Region XIII - Caraga':            ['Agusan del Norte', 'Agusan del Sur', 'Dinagat Islands', 'Surigao del Norte', 'Surigao del Sur'],
  'BARMM':                           ['Basilan', 'Lanao del Sur', 'Maguindanao del Norte', 'Maguindanao del Sur', 'Sulu', 'Tawi-Tawi'],
};

function lookupCity(name: string): [number, number, number] | null {
  if (!name) return null;

  if (CITY_GEO[name]) return CITY_GEO[name];

  const withoutCity = name.replace(/\s+city$/i, '').trim();
  if (withoutCity !== name && CITY_GEO[withoutCity]) return CITY_GEO[withoutCity];

  const withCity = name.trim() + ' City';
  if (CITY_GEO[withCity]) return CITY_GEO[withCity];

  const lower = name.toLowerCase();
  const found  = Object.keys(CITY_GEO).find(k => k.toLowerCase() === lower);
  if (found) return CITY_GEO[found];

  const lowerWithout = withoutCity.toLowerCase();
  const lowerWith    = lower.endsWith(' city') ? lower : lower + ' city';
  const found2 = Object.keys(CITY_GEO).find(k => {
    const kl = k.toLowerCase();
    return kl === lowerWithout || kl === lowerWith;
  });
  if (found2) return CITY_GEO[found2];

  return null;
}

export function MapCenter(
  selectedCity: string,
  selectedProvince: string,
  selectedRegion: string
): [number, number, number] {
  if (selectedCity) {
    const g = lookupCity(selectedCity);
    if (g) return g;
  }
  if (selectedProvince) {
    const g = PROVINCE_GEO[selectedProvince];
    if (g) return g;
  }
  if (selectedRegion) {
    const g = REGION_GEO[selectedRegion];
    if (g) return g;
  }
  return [12.8797, 121.7740, 6]; 
}