/* ═══ Models / Names ═══ A thousand-odd different first names for the grannies of the world tour — old-fashioned
   favourites from every corner of the globe. Each rider gets her own; no two share a first name. */

var RAW = [
  /* British & Irish */
  "Ethel Mabel Gladys Doris Edna Agnes Bertha Mildred Phyllis Beryl Hilda Muriel Florence Ida Gertrude Myrtle Peggy Shirley Vera Nora Ruth Esther Lorraine Marge Thelma Constance Winifred Bea Opal Hazel Maud Pearl",
  "Agatha Blanche Cora Dottie Elsie Fanny Gwendolyn Harriet Josephine Kitty Lavinia Matilda Nellie Prudence Queenie Rosalind Sybil Tabitha Ursula Violet Wanda Yvonne Augusta Clementine Eunice Flossie Georgina Henrietta",
  "Iris Jemima Loretta Marigold Nancy Petunia Rosemary Sadie Trudy Una Velma Winnie Adelaide Bunty Cecily Dora Edwina Fern Hattie Ivy June Kathleen Lottie Minnie Patsy Selma Tilly Alma Audrey Avis Barbara Betty",
  "Brenda Carol Cynthia Daphne Dorothy Eileen Elaine Enid Evelyn Freda Gail Glenda Gloria Gwen Heather Hester Hope Imogen Isobel Jean Joan Joyce Judith Kay Lilian Lois Mavis Maureen Maxine Meg Mona Nell Noreen",
  "Norma Olive Pamela Patience Pauline Penelope Philippa Rita Rowena Sheila Sylvia Teresa Una Valerie Wendy Ada Annie Bridget Brigid Clodagh Deirdre Eithne Fionnuala Grainne Kathleen Maeve Mairead Niamh Oonagh",
  "Orla Roisin Siobhan Sinead Aileen Moira Morag Isla Kirsty Elspeth Ishbel Morven Jessie Effie Nessie Senga Shona Wilhelmina Rhoda Griselda Hepzibah Millicent Ermintrude Honoria Lettice Olwen Bronwen Gwyneth",
  "Myfanwy Nerys Rhiannon Sian Ceinwen Angharad Eluned Megan Dilys Glenys Morwenna Tamsin Jenna Lowenna Demelza Ottoline Philomena Araminta Clarissa Drusilla Euphemia Felicity Gertie Hyacinth Leonora Marjorie",
  "Ottilie Rosamund Sibyl Theodora Veronica Wilma Zillah Bessie Dolly Effie Gracie Lizzie Mamie Molly Polly Rosie Susie Tessie Vinnie Annabel Arabella Beatrix Cordelia Dulcie Elvira Estelle Fenella Gaynor Hermione",
  /* French & Belgian */
  "Amelie Antoinette Bernadette Brigitte Camille Celestine Chantal Colette Delphine Denise Eloise Eugenie Fabienne Francoise Genevieve Germaine Gisele Helene Henriette Huguette Jacqueline Jeanne Josette Juliette",
  "Leontine Lucienne Madeleine Marcelle Margaux Mireille Monique Nicole Odette Odile Paulette Renee Simone Solange Suzanne Sylvie Therese Yvette Ginette Lisette Mathilde Clotilde Berthe Edith Ghislaine Violette",
  /* Italian */
  "Lucia Antonella Assunta Beatrice Carmela Concetta Donatella Elisabetta Filomena Franca Gabriella Giovanna Giuseppina Graziella Immacolata Lucrezia Marcella Mariella Nunzia Ornella Paola Raffaella Rosaria",
  "Serafina Silvana Teodora Valentina Vittoria Agata Annunziata Benedetta Clementina Ersilia Fiorella Gemma Ida Letizia Liliana Loredana Marisa Natalia Ottavia Pierina Rina Santina Tecla Ugolina Vincenza Zita",
  /* Spanish & Portuguese & Latin American */
  "Ines Carmen Lupe Dolores Pilar Rocio Consuelo Remedios Amparo Esperanza Milagros Socorro Rosario Mercedes Montserrat Begona Encarnacion Inmaculada Asuncion Purificacion Adoracion Felisa Herminia Leocadia",
  "Maricruz Nieves Paloma Soledad Trinidad Visitacion Azucena Candelaria Eulalia Guadalupe Lourdes Maite Xiomara Yolanda Zoraida Conchita Paquita Pepita Rosita Chela Cuca Lola Tere Nena Beba Fina Graciela",
  "Hortensia Leonor Marisol Noemi Ofelia Perpetua Rosalba Teofila Urbana Zulema Adelina Benedita Conceicao Fatima Gracinda Iracema Joaquina Lucinda Madalena Natercia Odete Rosinda Teresinha Zelia Aparecida",
  /* German, Austrian, Swiss, Dutch */
  "Heidi Ilse Gudrun Hannelore Hildegard Ingeborg Irmgard Liesel Lotte Magda Marlene Ottilia Renate Roswitha Sieglinde Trude Ulrike Waltraud Wiebke Brunhilde Elfriede Friederike Gerlinde Hedwig Henrike",
  "Annegret Adelheid Edeltraud Gisela Hertha Irmtraud Klothilde Leni Lieselotte Mechthild Notburga Rosl Traudl Vroni Zenzi Anneke Femke Geertje Hendrika Janneke Lieke Marijke Neeltje Saskia Truus Wilhelmina",
  /* Scandinavian & Finnish & Icelandic */
  "Ingrid Greta Astrid Birgitta Dagny Elin Freja Gunhild Hedda Ingeborg Jorunn Kirsten Lisbet Margit Ragnhild Sigrid Solveig Torborg Ulla Vigdis Aino Helmi Kerttu Lempi Martta Siiri Tyyne Hulda Gudrun Sigurlaug",
  /* Eastern European */
  "Olga Babushka Agafya Anfisa Dunya Evdokia Fedora Glafira Kseniya Lyudmila Marfa Nadezhda Praskovya Svetlana Tatiana Ulyana Varvara Vasilisa Yevgenia Zinaida Galina Raisa Tamara Valentina Zoya Lidiya Nina",
  "Agnieszka Bozena Danuta Elzbieta Grazyna Halina Jadwiga Krystyna Malgorzata Stanislawa Teresa Urszula Wanda Zofia Bozidara Dragica Jelena Milica Ruzica Vesna Zdenka Bohumila Jarmila Ludmila Vlasta Zdenka",
  "Erzsebet Ilona Jolan Katalin Magdolna Piroska Rozalia Terezia Viktoria Ileana Doina Florica Ioana Lacramioara Rodica Viorica Zamfira Desislava Gergana Mariyka Radka Stoyanka Tsvetanka Yordanka",
  /* Greek */
  "Eleni Yaya Athena Calliope Despina Eftychia Evangelia Fotini Georgia Kalliope Kyriaki Marigoula Niki Ourania Panagiota Roula Sofia Stavroula Theodora Vasiliki Xanthe Zoi Chrysoula Dimitra Efthalia",
  /* Hebrew & Jewish */
  "Rina Savta Shoshana Tova Yehudit Zipporah Batya Chaya Devorah Esther Fruma Golda Hadassah Leah Malka Miriam Naomi Pnina Rivka Sarah Tzipora Yocheved Bracha Dalia Gila Hannah Mazal Orly Ronit Shula Yaffa Ziva",
  /* Arabic, Turkish, Persian */
  "Amira Aziza Bahia Fadila Farida Habiba Jamila Karima Latifa Mounira Nadia Naima Rachida Safia Samira Wafaa Zahra Zeinab Zoubida Aylin Emine Fatma Gulsen Hatice Meral Nermin Sevim Sultan Zeynep Ayse Nazli",
  "Azadeh Farah Forough Golnar Laleh Mahin Mitra Nasrin Parvaneh Roshan Shirin Simin Soraya Taraneh Zohreh Anahita Behjat Fereshteh Homa Khadija Leila Maryam Nour Rania Salma Yasmin Hind Ghada Huda",
  /* South Asian */
  "Anjali Bhavna Chandra Damayanti Gita Indira Janaki Kamala Lakshmi Leela Mala Meera Nirmala Padma Parvati Pushpa Radha Rukmini Sarala Savitri Shanta Sita Sushila Usha Vimala Asha Kusum Lata Prema Sunita",
  "Bilkis Farhana Nasreen Rukhsana Shabnam Zubeida Amrita Harpreet Jaswinder Kuljit Manjit Paramjit Surinder Tejinder Daljit Rajni Sarojini Vasanthi Yamuna Ambika Bhagyalakshmi Gowri Kalyani Mangala",
  /* East & Southeast Asian */
  "Fumiko Akiko Chiyo Emiko Fusako Hanako Haruko Hideko Kazuko Keiko Kimiko Kiyoko Masako Michiko Mitsuko Nobuko Reiko Sachiko Setsuko Shizuko Sumiko Takako Teruko Toshiko Yasuko Yoshiko Yukiko Machiko Tomiko",
  "Mei Ah Lan Biyu Chunhua Fang Guiying Hong Huifang Jinghua Lihua Meihua Qiuyue Shufen Xiulan Yuehua Yufang Zhenzhen Baoyu Cuifen Fenghua Liqin Wanrong Xiaoling Yanping Zhihui Ok Soon Myung Hee Jung Ja",
  "Bok Soon Chun Hee Geum Ja Kyung Ja Mal Soon Sook Ja Young Ja Duong Hoa Hong Lan Mai Nga Phuong Thao Thuy Tuyet Xuan Yen Bituin Corazon Dalisay Ligaya Luzviminda Marikit Perla Remedios Tala Amihan",
  /* Pacific & Hawaiian & Maori */
  "Leilani Kalani Makana Noelani Pualani Kailani Iolana Lokelani Malia Nalani Aroha Hine Kiri Mere Moana Ngaio Rangi Tui Wairua Manaia Losa Sina Fetu Ana",
  /* African */
  "Abena Adwoa Akosua Ama Efua Esi Yaa Adaeze Chiamaka Chinwe Ifeoma Ngozi Nkechi Obiageli Folake Funmilayo Ronke Titilayo Yetunde Bisi Amara Asha Baraka Imani Neema Rehema Zawadi Nomsa Thandiwe Zanele",
  "Busisiwe Lindiwe Nandi Nokuthula Sibongile Themba Makena Wanjiru Njeri Wambui Achieng Atieno Awino Nafula Mumbua Mwende Kagiso Lerato Mpho Naledi Palesa Tumelo Fatou Aminata Mariama Awa Bintou Coumba",
  /* Americas & more */
  "Dolly Loretta Tammy Wynonna Bobbie Jolene Lurleen Maybelle Ozella Pearlie Queenie Rubye Sallie Viola Zelda Mozelle Ernestine Geneva Lucille Mattie Odessa Ola Vernice Willa Earline Fannie Johnnie Lula Eula",
  "Cleo Delta Dixie Floy Gussie Ina Juanita Lavonne Mavis Nettie Ora Reba Twila Verna Alberta Bernice Claudette Dorinda Evangeline Gaynell Lavina Merle Opaline Pansy Roberta Theda Ursa Wilda Zenobia Artemisia",
  /* A few more from everywhere */
  "Albertine Amabel Annis Belinda Bettina Carlotta Cherry Christabel Dorcas Dymphna Elfrida Ermengarde Esme Etta Evadne Fidelma Gaenor Gilberta Hepsie Ivah Jocasta Keziah Lavender Letitia Lilias Magnolia",
  "Marcia Melisande Mirabel Nerissa Oriel Persis Primrose Rosabel Sabina Tryphena Verity Wenna Yolande Zuleika Annora Blodwen Delyth Eirlys Lowri Marged Tegwen Branwen Carys Ffion Heulwen Morfydd Nia",
  /* Classical & whimsical */
  "Aurelia Cassia Cornelia Decima Flavia Julia Livia Lucilla Octavia Portia Septima Tullia Valeria Clio Daphne Electra Hera Ione Larissa Medea Penthea Phoebe Rhea Thalia Xanthippe Zenaida Andromeda Galatea"
];

function unique(list) {
  var seen = {}, out = [];
  list.forEach(function (n) { var k = n.toLowerCase(); if (!seen[k]) { seen[k] = 1; out.push(n); } });
  return out;
}

/* Some entries above are two-word names (e.g. "Ah Lan", "Ok Soon"): rebuild them from the raw strings */
function split(s) {
  var t = s.split(" "), out = [];
  for (var i = 0; i < t.length; i++) {
    /* Korean/Chinese/Vietnamese given names written as two parts stay together */
    if (/^(Ah|Ok|Myung|Jung|Bok|Chun|Geum|Kyung|Mal|Sook|Young)$/.test(t[i]) && t[i + 1]) { out.push(t[i] + " " + t[i + 1]); i++; }
    else out.push(t[i]);
  }
  return out;
}

export var FIRST_NAMES = unique([].concat.apply([], RAW.map(split)));
