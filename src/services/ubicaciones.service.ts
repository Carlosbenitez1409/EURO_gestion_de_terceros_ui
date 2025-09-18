export interface Pais {
    id: string;
    nombre: string;
    codigo: string;
}

export interface Departamento {
    id: string;
    nombre: string;
    codigo: string;
    ciudades: Ciudad[];
}

export interface Ciudad {
    id: string;
    nombre: string;
    codigo: string;
    departamentoId: string;
}

class UbicacionesService {
    private paises: Pais[] = [
        { id: "1", nombre: "Colombia", codigo: "CO" }
    ];

    private departamentos: Departamento[] = [
        {
            id: "1",
            nombre: "Cundinamarca",
            codigo: "CUN",
            ciudades: [
                { id: "1", nombre: "Bogotá D.C.", codigo: "BOG", departamentoId: "1" },
                { id: "2", nombre: "Soacha", codigo: "SOA", departamentoId: "1" },
                { id: "3", nombre: "Zipaquirá", codigo: "ZIP", departamentoId: "1" },
                { id: "4", nombre: "Facatativá", codigo: "FAC", departamentoId: "1" },
                { id: "5", nombre: "Chía", codigo: "CHI", departamentoId: "1" }
            ]
        },
        {
            id: "2",
            nombre: "Antioquia",
            codigo: "ANT",
            ciudades: [
                { id: "6", nombre: "Medellín", codigo: "MED", departamentoId: "2" },
                { id: "7", nombre: "Bello", codigo: "BEL", departamentoId: "2" },
                { id: "8", nombre: "Itagüí", codigo: "ITA", departamentoId: "2" },
                { id: "9", nombre: "Envigado", codigo: "ENV", departamentoId: "2" },
                { id: "10", nombre: "Rionegro", codigo: "RIO", departamentoId: "2" },
                { id: "11", nombre: "Abejorral", codigo: "ABE", departamentoId: "2" },
                { id: "12", nombre: "Abriaquí", codigo: "ABR", departamentoId: "2" },
                { id: "13", nombre: "Alejandría", codigo: "ALE", departamentoId: "2" },
                { id: "14", nombre: "Amagá", codigo: "AMA", departamentoId: "2" },
                { id: "15", nombre: "Amalfi", codigo: "AMF", departamentoId: "2" },
                { id: "16", nombre: "Andes", codigo: "AND", departamentoId: "2" },
                { id: "17", nombre: "Angelópolis", codigo: "ANG", departamentoId: "2" },
                { id: "18", nombre: "Angostura", codigo: "ANGS", departamentoId: "2" },
                { id: "19", nombre: "Anorí", codigo: "ANR", departamentoId: "2" },
                { id: "20", nombre: "Anzá", codigo: "ANZ", departamentoId: "2" },
                { id: "21", nombre: "Apartadó", codigo: "APA", departamentoId: "2" },
                { id: "22", nombre: "Arboletes", codigo: "ARB", departamentoId: "2" },
                { id: "23", nombre: "Argelia", codigo: "ARG", departamentoId: "2" },
                { id: "24", nombre: "Armenia", codigo: "ARM", departamentoId: "2" },
                { id: "25", nombre: "Barbosa", codigo: "BARB", departamentoId: "2" },
                { id: "26", nombre: "Belmira", codigo: "BELM", departamentoId: "2" },
                { id: "27", nombre: "Betania", codigo: "BET", departamentoId: "2" },
                { id: "28", nombre: "Betulia", codigo: "BETU", departamentoId: "2" },
                { id: "29", nombre: "Briceño", codigo: "BRI", departamentoId: "2" },
                { id: "30", nombre: "Buriticá", codigo: "BUR", departamentoId: "2" },
                { id: "31", nombre: "Cáceres", codigo: "CAC", departamentoId: "2" },
                { id: "32", nombre: "Caicedo", codigo: "CAI", departamentoId: "2" },
                { id: "33", nombre: "Caldas", codigo: "CALD", departamentoId: "2" },
                { id: "34", nombre: "Campamento", codigo: "CAM", departamentoId: "2" },
                { id: "35", nombre: "Cañasgordas", codigo: "CAN", departamentoId: "2" },
                { id: "36", nombre: "Caracolí", codigo: "CARC", departamentoId: "2" },
                { id: "37", nombre: "Caramanta", codigo: "CARM", departamentoId: "2" },
                { id: "38", nombre: "Carepa", codigo: "CARE", departamentoId: "2" },
                { id: "39", nombre: "Carolina", codigo: "CARO", departamentoId: "2" },
                { id: "40", nombre: "Caucasia", codigo: "CAU", departamentoId: "2" },
                { id: "41", nombre: "Chigorodó", codigo: "CHI", departamentoId: "2" },
                { id: "42", nombre: "Cisneros", codigo: "CIS", departamentoId: "2" },
                { id: "43", nombre: "Ciudad Bolívar", codigo: "CBOL", departamentoId: "2" },
                { id: "44", nombre: "Cocorná", codigo: "COC", departamentoId: "2" },
                { id: "45", nombre: "Concepción", codigo: "CON", departamentoId: "2" },
                { id: "46", nombre: "Concordia", codigo: "CONC", departamentoId: "2" },
                { id: "47", nombre: "Copacabana", codigo: "COP", departamentoId: "2" },
                { id: "48", nombre: "Dabeiba", codigo: "DAB", departamentoId: "2" },
                { id: "49", nombre: "Donmatías", codigo: "DON", departamentoId: "2" },
                { id: "50", nombre: "Ebéjico", codigo: "EBE", departamentoId: "2" },
                { id: "51", nombre: "El Bagre", codigo: "BAG", departamentoId: "2" },
                { id: "52", nombre: "El Carmen de Viboral", codigo: "CARV", departamentoId: "2" },
                { id: "53", nombre: "El Peñol", codigo: "PEN", departamentoId: "2" },
                { id: "54", nombre: "El Retiro", codigo: "RET", departamentoId: "2" },
                { id: "55", nombre: "El Santuario", codigo: "SAN", departamentoId: "2" },
                { id: "56", nombre: "Entrerríos", codigo: "ENT", departamentoId: "2" },
                { id: "57", nombre: "Fredonia", codigo: "FRE", departamentoId: "2" },
                { id: "58", nombre: "Frontino", codigo: "FRO", departamentoId: "2" },
                { id: "59", nombre: "Girardota", codigo: "GIR", departamentoId: "2" },
                { id: "60", nombre: "Gómez Plata", codigo: "GOM", departamentoId: "2" },
                { id: "61", nombre: "Granada", codigo: "GRA", departamentoId: "2" },
                { id: "62", nombre: "Guadalupe", codigo: "GUA", departamentoId: "2" },
                { id: "63", nombre: "Guarne", codigo: "GUAR", departamentoId: "2" },
                { id: "64", nombre: "Guatapé", codigo: "GTP", departamentoId: "2" },
                { id: "65", nombre: "Heliconia", codigo: "HEL", departamentoId: "2" },
                { id: "66", nombre: "Hispania", codigo: "HIS", departamentoId: "2" },
                { id: "67", nombre: "Ituango", codigo: "ITU", departamentoId: "2" },
                { id: "68", nombre: "Jardín", codigo: "JAR", departamentoId: "2" },
                { id: "69", nombre: "Jericó", codigo: "JER", departamentoId: "2" },
                { id: "70", nombre: "La Ceja", codigo: "CEJ", departamentoId: "2" },
                { id: "71", nombre: "La Estrella", codigo: "EST", departamentoId: "2" },
                { id: "72", nombre: "La Pintada", codigo: "PIN", departamentoId: "2" },
                { id: "73", nombre: "La Unión", codigo: "UNI", departamentoId: "2" },
                { id: "74", nombre: "Liborina", codigo: "LIB", departamentoId: "2" },
                { id: "75", nombre: "Maceo", codigo: "MAC", departamentoId: "2" },
                { id: "76", nombre: "Marinilla", codigo: "MAR", departamentoId: "2" },
                { id: "77", nombre: "Montebello", codigo: "MON", departamentoId: "2" },
                { id: "78", nombre: "Murindó", codigo: "MUR", departamentoId: "2" },
                { id: "79", nombre: "Mutatá", codigo: "MUT", departamentoId: "2" },
                { id: "80", nombre: "Nariño", codigo: "NAR", departamentoId: "2" },
                { id: "81", nombre: "Nechí", codigo: "NEC", departamentoId: "2" },
                { id: "82", nombre: "Necoclí", codigo: "NCL", departamentoId: "2" },
                { id: "83", nombre: "Olaya", codigo: "OLA", departamentoId: "2" },
                { id: "84", nombre: "Peque", codigo: "PEQ", departamentoId: "2" },
                { id: "85", nombre: "Pueblorrico", codigo: "PUEB", departamentoId: "2" },
                { id: "86", nombre: "Puerto Berrío", codigo: "PBER", departamentoId: "2" },
                { id: "87", nombre: "Puerto Nare", codigo: "PNAR", departamentoId: "2" },
                { id: "88", nombre: "Puerto Triunfo", codigo: "PTRI", departamentoId: "2" },
                { id: "89", nombre: "Remedios", codigo: "REM", departamentoId: "2" },
                { id: "90", nombre: "Sabanalarga", codigo: "SAB", departamentoId: "2" },
                { id: "91", nombre: "Sabaneta", codigo: "SABN", departamentoId: "2" },
                { id: "92", nombre: "Salgar", codigo: "SAL", departamentoId: "2" },
                { id: "93", nombre: "San Andrés de Cuerquia", codigo: "SAND", departamentoId: "2" },
                { id: "94", nombre: "San Carlos", codigo: "SCAR", departamentoId: "2" },
                { id: "95", nombre: "San Francisco", codigo: "SFR", departamentoId: "2" },
                { id: "96", nombre: "San Jerónimo", codigo: "SJER", departamentoId: "2" },
                { id: "97", nombre: "San José de la Montaña", codigo: "SJM", departamentoId: "2" },
                { id: "98", nombre: "San Juan de Urabá", codigo: "SJU", departamentoId: "2" },
                { id: "99", nombre: "San Luis", codigo: "SLU", departamentoId: "2" },
                { id: "100", nombre: "San Pedro de los Milagros", codigo: "SPM", departamentoId: "2" },
                { id: "101", nombre: "San Pedro de Urabá", codigo: "SPU", departamentoId: "2" },
                { id: "102", nombre: "San Rafael", codigo: "SRA", departamentoId: "2" },
                { id: "103", nombre: "San Roque", codigo: "SRO", departamentoId: "2" },
                { id: "104", nombre: "San Vicente Ferrer", codigo: "SVF", departamentoId: "2" },
                { id: "105", nombre: "Santa Bárbara", codigo: "SBA", departamentoId: "2" },
                { id: "106", nombre: "Santa Fe de Antioquia", codigo: "SFE", departamentoId: "2" },
                { id: "107", nombre: "Santa Rosa de Osos", codigo: "SROO", departamentoId: "2" },
                { id: "108", nombre: "Santo Domingo", codigo: "SDO", departamentoId: "2" },
                { id: "109", nombre: "Segovia", codigo: "SEG", departamentoId: "2" },
                { id: "110", nombre: "Sonsón", codigo: "SON", departamentoId: "2" },
                { id: "111", nombre: "Sopetrán", codigo: "SOP", departamentoId: "2" },
                { id: "112", nombre: "Támesis", codigo: "TAM", departamentoId: "2" },
                { id: "113", nombre: "Tarazá", codigo: "TAR", departamentoId: "2" },
                { id: "114", nombre: "Tarso", codigo: "TARS", departamentoId: "2" },
                { id: "115", nombre: "Titiribí", codigo: "TIT", departamentoId: "2" },
                { id: "116", nombre: "Toledo", codigo: "TOL", departamentoId: "2" },
                { id: "117", nombre: "Turbo", codigo: "TURB", departamentoId: "2" },
                { id: "118", nombre: "Uramita", codigo: "URA", departamentoId: "2" },
                { id: "119", nombre: "Urrao", codigo: "URR", departamentoId: "2" },
                { id: "120", nombre: "Valdivia", codigo: "VALD", departamentoId: "2" },
                { id: "121", nombre: "Valparaíso", codigo: "VALP", departamentoId: "2" },
                { id: "122", nombre: "Vegachí", codigo: "VEG", departamentoId: "2" },
                { id: "123", nombre: "Venecia", codigo: "VEN", departamentoId: "2" },
                { id: "124", nombre: "Vigía del Fuerte", codigo: "VIG", departamentoId: "2" },
                { id: "125", nombre: "Yalí", codigo: "YAL", departamentoId: "2" },
                { id: "126", nombre: "Yarumal", codigo: "YAR", departamentoId: "2" },
                { id: "127", nombre: "Yolombó", codigo: "YOL", departamentoId: "2" },
                { id: "128", nombre: "Yondó", codigo: "YON", departamentoId: "2" },
                { id: "129", nombre: "Zaragoza", codigo: "ZAR", departamentoId: "2" }
            ]
        },
        {
            id: "3",
            nombre: "Valle del Cauca",
            codigo: "VAL",
            ciudades: [
                { id: "130", nombre: "Cali", codigo: "CAL", departamentoId: "3" },
                { id: "131", nombre: "Palmira", codigo: "PAL", departamentoId: "3" },
                { id: "132", nombre: "Buenaventura", codigo: "BUE", departamentoId: "3" },
                { id: "133", nombre: "Tuluá", codigo: "TUL", departamentoId: "3" },
                { id: "134", nombre: "Cartago", codigo: "CAR", departamentoId: "3" }
            ]
        },
        {
            id: "4",
            nombre: "Atlántico",
            codigo: "ATL",
            ciudades: [
                { id: "135", nombre: "Barranquilla", codigo: "BAR", departamentoId: "4" },
                { id: "136", nombre: "Soledad", codigo: "SOL", departamentoId: "4" },
                { id: "137", nombre: "Malambo", codigo: "MAL", departamentoId: "4" },
                { id: "138", nombre: "Sabanagrande", codigo: "SAB", departamentoId: "4" },
                { id: "139", nombre: "Puerto Colombia", codigo: "PUE", departamentoId: "4" },
                { id: "140", nombre: "Galapa", codigo: "GAL", departamentoId: "4" },
                { id: "141", nombre: "Santo Tomás", codigo: "STO", departamentoId: "4" },
                { id: "142", nombre: "Palmar de Varela", codigo: "PAL", departamentoId: "4" },
                { id: "143", nombre: "Campo de la Cruz", codigo: "CDC", departamentoId: "4" },
                { id: "144", nombre: "Baranoa", codigo: "BAN", departamentoId: "4" }
            ]
        },
        {
            id: "5",
            nombre: "Santander",
            codigo: "SAN",
            ciudades: [
                { id: "145", nombre: "Bucaramanga", codigo: "BUC", departamentoId: "5" },
                { id: "146", nombre: "Floridablanca", codigo: "FLO", departamentoId: "5" },
                { id: "147", nombre: "Girón", codigo: "GIR", departamentoId: "5" },
                { id: "148", nombre: "Piedecuesta", codigo: "PIE", departamentoId: "5" },
                { id: "149", nombre: "Barrancabermeja", codigo: "BAB", departamentoId: "5" }
            ]
        },
        {
            id: "6",
            nombre: "Amazonas",
            codigo: "AMA",
            ciudades: [
                { id: "150", nombre: "Leticia", codigo: "LET", departamentoId: "6" },
                { id: "151", nombre: "Puerto Nariño", codigo: "PUN", departamentoId: "6" },
                { id: "152", nombre: "Tarapacá", codigo: "TAR", departamentoId: "6" },
                { id: "153", nombre: "La Chorrera", codigo: "LCH", departamentoId: "6" },
                { id: "154", nombre: "La Pedrera", codigo: "LPD", departamentoId: "6" },
                { id: "155", nombre: "El Encanto", codigo: "ENC", departamentoId: "6" },
                { id: "156", nombre: "Puerto Santander", codigo: "PSA", departamentoId: "6" },
                { id: "157", nombre: "Mirití-Paraná", codigo: "MIR", departamentoId: "6" },
                { id: "158", nombre: "Puerto Alegría", codigo: "PAL", departamentoId: "6" },
                { id: "159", nombre: "Puerto Arica", codigo: "PAR", departamentoId: "6" }
            ]
        },
        {
            id: "7",
            nombre: "Bolívar",
            codigo: "BOL",
            ciudades: [
                { id: "160", nombre: "Cartagena de Indias", codigo: "CAR", departamentoId: "7" },
                { id: "161", nombre: "Magangué", codigo: "MAG", departamentoId: "7" },
                { id: "162", nombre: "Turbaco", codigo: "TUR", departamentoId: "7" },
                { id: "163", nombre: "Arjona", codigo: "ARJ", departamentoId: "7" },
                { id: "164", nombre: "Santa Rosa", codigo: "SRO", departamentoId: "7" },
                { id: "165", nombre: "Mahates", codigo: "MAH", departamentoId: "7" },
                { id: "166", nombre: "Carmen de Bolívar", codigo: "CBO", departamentoId: "7" },
                { id: "167", nombre: "María La Baja", codigo: "MLB", departamentoId: "7" },
                { id: "168", nombre: "Mompós", codigo: "MOM", departamentoId: "7" },
                { id: "169", nombre: "San Juan Nepomuceno", codigo: "SJN", departamentoId: "7" }
            ]
        },
        {
            id: "8",
            nombre: "Cauca",
            codigo: "CAU",
            ciudades: [
                { id: "173", nombre: "Popayán", codigo: "POP", departamentoId: "8" },
                { id: "174", nombre: "Santander de Quilichao", codigo: "SAN", departamentoId: "8" }
            ]
        },
        {
            id: "9",
            nombre: "Cesar",
            codigo: "CES",
            ciudades: [
                { id: "175", nombre: "Valledupar", codigo: "VAL", departamentoId: "9" },
                { id: "176", nombre: "La Jagua de Ibirico", codigo: "LAJ", departamentoId: "9" },
                { id: "177", nombre: "Aguachica", codigo: "AGU", departamentoId: "9" },
                { id: "178", nombre: "Bosconia", codigo: "BOS", departamentoId: "9" },
                { id: "179", nombre: "Curumaní", codigo: "CUR", departamentoId: "9" },
                { id: "180", nombre: "Chimichagua", codigo: "CHI", departamentoId: "9" },
                { id: "181", nombre: "El Copey", codigo: "COP", departamentoId: "9" },
                { id: "182", nombre: "Agustín Codazzi", codigo: "COD", departamentoId: "9" },
                { id: "183", nombre: "Tamalameque", codigo: "TAM", departamentoId: "9" },
                { id: "184", nombre: "Gamarra", codigo: "GAM", departamentoId: "9" }
            ]
        },
        {
            id: "10",
            nombre: "Huila",
            codigo: "HUI",
            ciudades: [
                { id: "185", nombre: "Neiva", codigo: "NEI", departamentoId: "10" },
                { id: "186", nombre: "Pitalito", codigo: "PIT", departamentoId: "10" },
                { id: "187", nombre: "Garzón", codigo: "GAR", departamentoId: "10" },
                { id: "188", nombre: "La Plata", codigo: "LPL", departamentoId: "10" },
                { id: "189", nombre: "Campoalegre", codigo: "CAM", departamentoId: "10" },
                { id: "190", nombre: "San Agustín", codigo: "SAG", departamentoId: "10" },
                { id: "191", nombre: "Isnos", codigo: "ISN", departamentoId: "10" },
                { id: "192", nombre: "Palermo", codigo: "PAL", departamentoId: "10" },
                { id: "193", nombre: "Acevedo", codigo: "ACE", departamentoId: "10" },
                { id: "194", nombre: "Algeciras", codigo: "ALG", departamentoId: "10" }
            ]
        },
        {
            id: "11",
            nombre: "Arauca",
            codigo: "ARA",
            ciudades: [
                { id: "195", nombre: "Arauca", codigo: "ARA", departamentoId: "11" },
                { id: "196", nombre: "Tame", codigo: "TAM", departamentoId: "11" },
                { id: "197", nombre: "Arauquita", codigo: "ARQ", departamentoId: "11" },
                { id: "198", nombre: "Cravo Norte", codigo: "CRN", departamentoId: "11" },
                { id: "199", nombre: "Fortul", codigo: "FOR", departamentoId: "11" },
                { id: "200", nombre: "Puerto Rondón", codigo: "PRN", departamentoId: "11" },
                { id: "201", nombre: "Saravena", codigo: "SAR", departamentoId: "11" }
            ]
        },
        {
            id: "12",
            nombre: "Boyacá",
            codigo: "BOY",
            ciudades: [
                { id: "202", nombre: "Tunja", codigo: "TUN", departamentoId: "12" },
                { id: "203", nombre: "Duitama", codigo: "DUI", departamentoId: "12" },
                { id: "204", nombre: "Sogamoso", codigo: "SOG", departamentoId: "12" },
                { id: "205", nombre: "Chiquinquirá", codigo: "CHQ", departamentoId: "12" },
                { id: "206", nombre: "Samacá", codigo: "SAM", departamentoId: "12" },
                { id: "207", nombre: "Paipa", codigo: "PAI", departamentoId: "12" },
                { id: "208", nombre: "Nobsa", codigo: "NOB", departamentoId: "12" },
                { id: "209", nombre: "Moniquirá", codigo: "MON", departamentoId: "12" },
                { id: "210", nombre: "Puerto Boyacá", codigo: "PBO", departamentoId: "12" },
                { id: "211", nombre: "Villa de Leyva", codigo: "VDL", departamentoId: "12" }
            ]
        },
        {
            id: "13",
            nombre: "Caldas",
            codigo: "CAL",
            ciudades: [
                { id: "212", nombre: "Manizales", codigo: "MAN", departamentoId: "13" },
                { id: "213", nombre: "Chinchiná", codigo: "CHI", departamentoId: "13" },
                { id: "214", nombre: "Riosucio", codigo: "RIO", departamentoId: "13" },
                { id: "215", nombre: "La Dorada", codigo: "DOR", departamentoId: "13" },
                { id: "216", nombre: "Villamaría", codigo: "VIL", departamentoId: "13" },
                { id: "217", nombre: "Supía", codigo: "SUP", departamentoId: "13" },
                { id: "218", nombre: "Anserma", codigo: "ANS", departamentoId: "13" },
                { id: "219", nombre: "Neira", codigo: "NEI", departamentoId: "13" },
                { id: "220", nombre: "Aranzazu", codigo: "ARA", departamentoId: "13" },
                { id: "221", nombre: "Salamina", codigo: "SAL", departamentoId: "13" }
            ]
        },
        {
            id: "14",
            nombre: "Caquetá",
            codigo: "CAQ",
            ciudades: [
                { id: "222", nombre: "Florencia", codigo: "FLO", departamentoId: "14" },
                { id: "223", nombre: "Belén de los Andaquíes", codigo: "BEL", departamentoId: "14" },
                { id: "224", nombre: "San Vicente del Caguán", codigo: "SVC", departamentoId: "14" },
                { id: "225", nombre: "Puerto Rico", codigo: "PRI", departamentoId: "14" },
                { id: "226", nombre: "Cartagena del Chairá", codigo: "CCH", departamentoId: "14" },
                { id: "227", nombre: "El Doncello", codigo: "DON", departamentoId: "14" },
                { id: "228", nombre: "Morelia", codigo: "MOR", departamentoId: "14" },
                { id: "229", nombre: "Puerto Milán", codigo: "PMI", departamentoId: "14" },
                { id: "230", nombre: "Curillo", codigo: "CUR", departamentoId: "14" },
                { id: "231", nombre: "Albania", codigo: "ALB", departamentoId: "14" }
            ]
        },
        {
            id: "15",
            nombre: "Casanare",
            codigo: "CAS",
            ciudades: [
                { id: "232", nombre: "Yopal", codigo: "YOP", departamentoId: "15" },
                { id: "233", nombre: "Aguazul", codigo: "AGU", departamentoId: "15" },
                { id: "234", nombre: "Villanueva", codigo: "VIL", departamentoId: "15" },
                { id: "235", nombre: "Monterrey", codigo: "MON", departamentoId: "15" },
                { id: "236", nombre: "Tauramena", codigo: "TAU", departamentoId: "15" },
                { id: "237", nombre: "Trinidad", codigo: "TRI", departamentoId: "15" },
                { id: "238", nombre: "Paz de Ariporo", codigo: "PAZ", departamentoId: "15" },
                { id: "239", nombre: "Orocué", codigo: "ORO", departamentoId: "15" },
                { id: "240", nombre: "Maní", codigo: "MAN", departamentoId: "15" },
                { id: "241", nombre: "Nunchía", codigo: "NUN", departamentoId: "15" }
            ]
        },
        {
            id: "16",
            nombre: "Chocó",
            codigo: "CHO",
            ciudades: [
                { id: "242", nombre: "Quibdó", codigo: "QUI", departamentoId: "16" },
                { id: "243", nombre: "Istmina", codigo: "IST", departamentoId: "16" },
                { id: "244", nombre: "Condoto", codigo: "CON", departamentoId: "16" },
                { id: "245", nombre: "Tadó", codigo: "TAD", departamentoId: "16" },
                { id: "246", nombre: "Medio Atrato", codigo: "MAT", departamentoId: "16" },
                { id: "247", nombre: "El Carmen de Atrato", codigo: "CAR", departamentoId: "16" },
                { id: "248", nombre: "Acandí", codigo: "ACA", departamentoId: "16" },
                { id: "249", nombre: "Bahía Solano", codigo: "BAS", departamentoId: "16" },
                { id: "250", nombre: "Nuquí", codigo: "NUQ", departamentoId: "16" },
                { id: "251", nombre: "Sipí", codigo: "SIP", departamentoId: "16" }
            ]
        },
        {
            id: "17",
            nombre: "Córdoba",
            codigo: "COR",
            ciudades: [
                { id: "252", nombre: "Montería", codigo: "MON", departamentoId: "17" },
                { id: "253", nombre: "Cereté", codigo: "CER", departamentoId: "17" },
                { id: "254", nombre: "Sahagún", codigo: "SAH", departamentoId: "17" },
                { id: "255", nombre: "Lorica", codigo: "LOR", departamentoId: "17" },
                { id: "256", nombre: "Montelíbano", codigo: "MLI", departamentoId: "17" },
                { id: "257", nombre: "Planeta Rica", codigo: "PRI", departamentoId: "17" },
                { id: "258", nombre: "Tierralta", codigo: "TIE", departamentoId: "17" },
                { id: "259", nombre: "San Pelayo", codigo: "SPE", departamentoId: "17" },
                { id: "260", nombre: "Puerto Libertador", codigo: "PLI", departamentoId: "17" },
                { id: "261", nombre: "Ayapel", codigo: "AYA", departamentoId: "17" }
            ]
        },
        {
            id: "18",
            nombre: "Guainía",
            codigo: "GUA",
            ciudades: [
                { id: "262", nombre: "Inírida", codigo: "INI", departamentoId: "18" },
                { id: "263", nombre: "Barranco Minas", codigo: "BAM", departamentoId: "18" },
                { id: "264", nombre: "Mapiripana", codigo: "MAP", departamentoId: "18" },
                { id: "265", nombre: "San Felipe", codigo: "SFE", departamentoId: "18" },
                { id: "266", nombre: "Puerto Colombia", codigo: "PCO", departamentoId: "18" },
                { id: "267", nombre: "La Guadalupe", codigo: "LGA", departamentoId: "18" },
                { id: "268", nombre: "Cacahual", codigo: "CAC", departamentoId: "18" },
                { id: "269", nombre: "Pana Pana", codigo: "PAN", departamentoId: "18" },
                { id: "270", nombre: "Morichal", codigo: "MOR", departamentoId: "18" }
            ]
        },
        {
            id: "19",
            nombre: "Guaviare",
            codigo: "GUV",
            ciudades: [
                { id: "271", nombre: "San José del Guaviare", codigo: "SJG", departamentoId: "19" },
                { id: "272", nombre: "Calamar", codigo: "CAL", departamentoId: "19" },
                { id: "273", nombre: "El Retorno", codigo: "RET", departamentoId: "19" },
                { id: "274", nombre: "Miraflores", codigo: "MIR", departamentoId: "19" }
            ]
        }
    ];

    // Métodos para países
    async getPaises(): Promise<Pais[]> {
        return Promise.resolve(this.paises);
    }

    async getPais(id: string): Promise<Pais | null> {
        const pais = this.paises.find(p => p.id === id);
        return Promise.resolve(pais || null);
    }

    // Métodos para departamentos
    async getDepartamentos(paisId?: string): Promise<Departamento[]> {
        // Simular delay de API
        await new Promise(resolve => setTimeout(resolve, 300));
        return this.departamentos;
    }

    async getDepartamento(id: string): Promise<Departamento | null> {
        await new Promise(resolve => setTimeout(resolve, 200));
        return this.departamentos.find(dept => dept.id === id) || null;
    }

    async getCiudadesByDepartamento(departamentoId: string): Promise<Ciudad[]> {
        await new Promise(resolve => setTimeout(resolve, 250));
        const departamento = this.departamentos.find(dept => dept.id === departamentoId);
        return departamento ? departamento.ciudades : [];
    }

    async getCiudad(id: string): Promise<Ciudad | null> {
        await new Promise(resolve => setTimeout(resolve, 200));

        for (const departamento of this.departamentos) {
            const ciudad = departamento.ciudades.find(ciudad => ciudad.id === id);
            if (ciudad) {
                return ciudad;
            }
        }
        return null;
    }

    async getCiudades(departamentoId: string, paisId?: string): Promise<Ciudad[]> {
        await new Promise(resolve => setTimeout(resolve, 250));
        const departamento = this.departamentos.find(dept => dept.id === departamentoId);
        return departamento ? departamento.ciudades : [];
    }

    async searchCiudades(searchTerm: string): Promise<Ciudad[]> {
        await new Promise(resolve => setTimeout(resolve, 300));

        const allCiudades: Ciudad[] = [];
        this.departamentos.forEach(dept => {
            allCiudades.push(...dept.ciudades);
        });

        if (!searchTerm) return allCiudades;

        const searchLower = searchTerm.toLowerCase();
        return allCiudades.filter(ciudad =>
            ciudad.nombre.toLowerCase().includes(searchLower) ||
            ciudad.codigo.toLowerCase().includes(searchLower)
        );
    }

    async searchDepartamentos(searchTerm: string): Promise<Departamento[]> {
        await new Promise(resolve => setTimeout(resolve, 300));

        if (!searchTerm) return this.departamentos;

        const searchLower = searchTerm.toLowerCase();
        return this.departamentos.filter(dept =>
            dept.nombre.toLowerCase().includes(searchLower) ||
            dept.codigo.toLowerCase().includes(searchLower)
        );
    }

    // Métodos de utilidad
    getDepartamentoNameByCiudadId(ciudadId: string): string | null {
        for (const departamento of this.departamentos) {
            const ciudad = departamento.ciudades.find(c => c.id === ciudadId);
            if (ciudad) {
                return departamento.nombre;
            }
        }
        return null;
    }

    getCiudadNameById(ciudadId: string): string | null {
        for (const departamento of this.departamentos) {
            const ciudad = departamento.ciudades.find(c => c.id === ciudadId);
            if (ciudad) {
                return ciudad.nombre;
            }
        }
        return null;
    }

    getDepartamentoNameById(departamentoId: string): string | null {
        const departamento = this.departamentos.find(d => d.id === departamentoId);
        return departamento ? departamento.nombre : null;
    }

    // Validación
    isValidCiudadDepartamento(ciudadId: string, departamentoId: string): boolean {
        const departamento = this.departamentos.find(d => d.id === departamentoId);
        if (!departamento) return false;

        return departamento.ciudades.some(c => c.id === ciudadId);
    }
}

export const ubicacionesService = new UbicacionesService();
