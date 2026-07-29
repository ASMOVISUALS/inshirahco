
CREATE TABLE public.surahs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number integer NOT NULL UNIQUE CHECK (number BETWEEN 1 AND 114),
  name_en text NOT NULL,
  name_ar text NOT NULL,
  verse_count integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.surahs TO anon;
GRANT SELECT ON public.surahs TO authenticated;
GRANT ALL ON public.surahs TO service_role;
ALTER TABLE public.surahs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Surahs are viewable by everyone" ON public.surahs FOR SELECT USING (true);
CREATE POLICY "Admins manage surahs" ON public.surahs FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER surahs_updated_at BEFORE UPDATE ON public.surahs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.surahs (number, name_en, name_ar, verse_count) VALUES
(1,'Al-Fatihah','الفاتحة',7),
(2,'Al-Baqarah','البقرة',286),
(3,'Ali ''Imran','آل عمران',200),
(4,'An-Nisa','النساء',176),
(5,'Al-Ma''idah','المائدة',120),
(6,'Al-An''am','الأنعام',165),
(7,'Al-A''raf','الأعراف',206),
(8,'Al-Anfal','الأنفال',75),
(9,'At-Tawbah','التوبة',129),
(10,'Yunus','يونس',109),
(11,'Hud','هود',123),
(12,'Yusuf','يوسف',111),
(13,'Ar-Ra''d','الرعد',43),
(14,'Ibrahim','إبراهيم',52),
(15,'Al-Hijr','الحجر',99),
(16,'An-Nahl','النحل',128),
(17,'Al-Isra','الإسراء',111),
(18,'Al-Kahf','الكهف',110),
(19,'Maryam','مريم',98),
(20,'Ta-Ha','طه',135),
(21,'Al-Anbiya','الأنبياء',112),
(22,'Al-Hajj','الحج',78),
(23,'Al-Mu''minun','المؤمنون',118),
(24,'An-Nur','النور',64),
(25,'Al-Furqan','الفرقان',77),
(26,'Ash-Shu''ara','الشعراء',227),
(27,'An-Naml','النمل',93),
(28,'Al-Qasas','القصص',88),
(29,'Al-''Ankabut','العنكبوت',69),
(30,'Ar-Rum','الروم',60),
(31,'Luqman','لقمان',34),
(32,'As-Sajdah','السجدة',30),
(33,'Al-Ahzab','الأحزاب',73),
(34,'Saba','سبأ',54),
(35,'Fatir','فاطر',45),
(36,'Ya-Sin','يس',83),
(37,'As-Saffat','الصافات',182),
(38,'Sad','ص',88),
(39,'Az-Zumar','الزمر',75),
(40,'Ghafir','غافر',85),
(41,'Fussilat','فصلت',54),
(42,'Ash-Shura','الشورى',53),
(43,'Az-Zukhruf','الزخرف',89),
(44,'Ad-Dukhan','الدخان',59),
(45,'Al-Jathiyah','الجاثية',37),
(46,'Al-Ahqaf','الأحقاف',35),
(47,'Muhammad','محمد',38),
(48,'Al-Fath','الفتح',29),
(49,'Al-Hujurat','الحجرات',18),
(50,'Qaf','ق',45),
(51,'Adh-Dhariyat','الذاريات',60),
(52,'At-Tur','الطور',49),
(53,'An-Najm','النجم',62),
(54,'Al-Qamar','القمر',55),
(55,'Ar-Rahman','الرحمن',78),
(56,'Al-Waqi''ah','الواقعة',96),
(57,'Al-Hadid','الحديد',29),
(58,'Al-Mujadilah','المجادلة',22),
(59,'Al-Hashr','الحشر',24),
(60,'Al-Mumtahanah','الممتحنة',13),
(61,'As-Saff','الصف',14),
(62,'Al-Jumu''ah','الجمعة',11),
(63,'Al-Munafiqun','المنافقون',11),
(64,'At-Taghabun','التغابن',18),
(65,'At-Talaq','الطلاق',12),
(66,'At-Tahrim','التحريم',12),
(67,'Al-Mulk','الملك',30),
(68,'Al-Qalam','القلم',52),
(69,'Al-Haqqah','الحاقة',52),
(70,'Al-Ma''arij','المعارج',44),
(71,'Nuh','نوح',28),
(72,'Al-Jinn','الجن',28),
(73,'Al-Muzzammil','المزمل',20),
(74,'Al-Muddaththir','المدثر',56),
(75,'Al-Qiyamah','القيامة',40),
(76,'Al-Insan','الإنسان',31),
(77,'Al-Mursalat','المرسلات',50),
(78,'An-Naba','النبأ',40),
(79,'An-Nazi''at','النازعات',46),
(80,'''Abasa','عبس',42),
(81,'At-Takwir','التكوير',29),
(82,'Al-Infitar','الانفطار',19),
(83,'Al-Mutaffifin','المطففين',36),
(84,'Al-Inshiqaq','الانشقاق',25),
(85,'Al-Buruj','البروج',22),
(86,'At-Tariq','الطارق',17),
(87,'Al-A''la','الأعلى',19),
(88,'Al-Ghashiyah','الغاشية',26),
(89,'Al-Fajr','الفجر',30),
(90,'Al-Balad','البلد',20),
(91,'Ash-Shams','الشمس',15),
(92,'Al-Layl','الليل',21),
(93,'Ad-Duha','الضحى',11),
(94,'Ash-Sharh','الشرح',8),
(95,'At-Tin','التين',8),
(96,'Al-''Alaq','العلق',19),
(97,'Al-Qadr','القدر',5),
(98,'Al-Bayyinah','البينة',8),
(99,'Az-Zalzalah','الزلزلة',8),
(100,'Al-''Adiyat','العاديات',11),
(101,'Al-Qari''ah','القارعة',11),
(102,'At-Takathur','التكاثر',8),
(103,'Al-''Asr','العصر',3),
(104,'Al-Humazah','الهمزة',9),
(105,'Al-Fil','الفيل',5),
(106,'Quraysh','قريش',4),
(107,'Al-Ma''un','الماعون',7),
(108,'Al-Kawthar','الكوثر',3),
(109,'Al-Kafirun','الكافرون',6),
(110,'An-Nasr','النصر',3),
(111,'Al-Masad','المسد',5),
(112,'Al-Ikhlas','الإخلاص',4),
(113,'Al-Falaq','الفلق',5),
(114,'An-Nas','الناس',6);

ALTER TABLE public.reflections RENAME TO ayahs;
ALTER TABLE public.ayahs ADD COLUMN surah_id uuid REFERENCES public.surahs(id) ON DELETE RESTRICT;
ALTER TABLE public.ayahs ADD COLUMN ayah_number integer;

UPDATE public.ayahs a
SET surah_id = s.id,
    ayah_number = (regexp_match(a.reference, '(\d+)\s*:\s*(\d+)\s*$'))[2]::int
FROM public.surahs s
WHERE (regexp_match(a.reference, '(\d+)\s*:\s*(\d+)\s*$')) IS NOT NULL
  AND s.number = (regexp_match(a.reference, '(\d+)\s*:\s*(\d+)\s*$'))[1]::int;

DELETE FROM public.ayahs a USING public.ayahs b
WHERE a.surah_id IS NOT NULL AND a.surah_id = b.surah_id
  AND a.ayah_number = b.ayah_number
  AND (a.created_at, a.id) > (b.created_at, b.id);

CREATE UNIQUE INDEX ayahs_surah_ayah_unique ON public.ayahs (surah_id, ayah_number) WHERE surah_id IS NOT NULL AND ayah_number IS NOT NULL;

CREATE TABLE public.reflections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ayah_id uuid NOT NULL REFERENCES public.ayahs(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 5000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX reflections_ayah_idx ON public.reflections (ayah_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reflections TO authenticated;
GRANT ALL ON public.reflections TO service_role;
ALTER TABLE public.reflections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own reflections" ON public.reflections FOR SELECT TO authenticated USING (user_id = auth.uid() OR has_role(auth.uid(),'admin'));
CREATE POLICY "Users insert own reflections" ON public.reflections FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own reflections" ON public.reflections FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own reflections" ON public.reflections FOR DELETE TO authenticated USING (user_id = auth.uid() OR has_role(auth.uid(),'admin'));
CREATE TRIGGER reflections_updated_at BEFORE UPDATE ON public.reflections FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
