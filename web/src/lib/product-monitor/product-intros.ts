import type { LocalizedText } from "./types";

/** Product intros keyed by ProductMonitorRecord.id */
export const productIntros: Record<string, LocalizedText> = {
  "pm-bpc157": {
    en: "BPC-157 (Body Protection Compound-157) is a synthetic 15-amino-acid peptide derived from a protective protein found in human gastric juice. It is studied for tissue repair, angiogenesis, gut mucosal healing, and recovery of tendons, ligaments, and soft tissue.",
    zh: "BPC-157（Body Protection Compound-157）是一种由人体胃液中保护性蛋白衍生的合成十五肽。研究关注其组织修复、血管新生、胃肠黏膜愈合，以及肌腱、韧带与软组织恢复等作用。",
    brief: {
      en: "Gastric pentadecapeptide for tissue repair and soft-tissue recovery.",
      zh: "胃源十五肽，主打组织修复与软组织恢复。",
    },
  },
  "pm-mots-c": {
    en: "MOTS-c is a mitochondrial-derived peptide encoded by the mitochondrial 12S rRNA gene. It functions as a metabolic regulator that influences insulin sensitivity, AMPK-related energy pathways, and exercise-related metabolic adaptation.",
    zh: "MOTS-c 是由线粒体 12S rRNA 基因编码的线粒体衍生肽。它作为代谢调节信号，影响胰岛素敏感性、AMPK 相关能量通路，以及运动相关的代谢适应。",
    brief: {
      en: "Mitochondrial peptide regulating metabolism and insulin sensitivity.",
      zh: "线粒体肽，调节代谢与胰岛素敏感性。",
    },
  },
  "pm-ghk-cu": {
    en: "GHK-Cu is a naturally occurring copper peptide (glycyl-L-histidyl-L-lysine bound to a copper ion) that functions as a powerful signal for tissue repair, collagen synthesis, and skin remodeling. Because the body's natural levels of GHK-Cu drop significantly as you age, it is widely utilized in anti-aging, skin, and hair care.",
    zh: "GHK-Cu 是一种天然存在的铜肽（甘氨酰-L-组氨酰-L-赖氨酸与铜离子结合），作为组织修复、胶原蛋白合成和皮肤重塑的强效信号分子发挥作用。由于随年龄增长体内的 GHK-Cu 水平显著下降，它被广泛用于抗衰老、皮肤和头发护理。",
    brief: {
      en: "Copper peptide for collagen synthesis and skin remodeling.",
      zh: "蓝铜肽，促进胶原合成与皮肤重塑。",
    },
  },
  "pm-tb500": {
    en: "TB-500 is a synthetic fragment related to Thymosin Beta-4, a 43-amino-acid actin-sequestering peptide. It is associated with cell migration, angiogenesis, inflammation modulation, and soft-tissue recovery research.",
    zh: "TB-500 是与胸腺素 β-4（Thymosin Beta-4，43 氨基酸肌动蛋白结合肽）相关的合成片段。研究关注其细胞迁移、血管新生、炎症调节与软组织恢复等作用。",
    brief: {
      en: "Thymosin β-4–related fragment for soft-tissue recovery.",
      zh: "胸腺素 β-4 相关片段，用于软组织恢复。",
    },
  },
  "pm-cjc-ipa": {
    en: "CJC-1295 + Ipamorelin is a growth-hormone secretagogue combination: CJC-1295 is a GHRH analogue that prolongs GH pulse signaling, while Ipamorelin is a selective ghrelin-receptor (GHS-R) agonist. Together they are used to support pulsatile GH release with a comparatively selective receptor profile.",
    zh: "CJC-1295 + Ipamorelin 是生长激素促分泌组合：CJC-1295 为 GHRH 类似物，可延长 GH 脉冲信号；Ipamorelin 为选择性胃饥饿素受体（GHS-R）激动剂。二者常用于支持脉冲式生长激素释放，并具有相对选择性的受体作用特征。",
    brief: {
      en: "GHRH + ghrelin agonist combo for pulsatile GH release.",
      zh: "GHRH + 胃饥饿素激动剂，促脉冲式 GH 释放。",
    },
  },
  "pm-tesamorelin": {
    en: "Tesamorelin is a stabilized growth hormone-releasing hormone (GHRH) analogue. It stimulates endogenous GH and IGF-1 pathways and is clinically known for reducing visceral adipose tissue in specific approved indications.",
    zh: "Tesamorelin 是一种稳定化的生长激素释放激素（GHRH）类似物。它刺激内源性 GH 与 IGF-1 通路，临床上以减少特定适应症中的内脏脂肪而闻名。",
    brief: {
      en: "Stabilized GHRH analogue; reduces visceral fat.",
      zh: "稳定化 GHRH 类似物，减少内脏脂肪。",
    },
  },
  "pm-bpc-tb-blend": {
    en: "BPC-157 + TB-500 is a recovery-oriented blend combining the gastric-derived pentadecapeptide BPC-157 with the Thymosin Beta-4–related fragment TB-500. The combination is positioned for complementary tissue-repair and soft-tissue recovery research use cases.",
    zh: "BPC-157 + TB-500 是以恢复为导向的组合配方，将胃源十五肽 BPC-157 与胸腺素 β-4 相关片段 TB-500 搭配。该组合面向互补的组织修复与软组织恢复研究场景。",
    brief: {
      en: "BPC-157 + TB-500 recovery blend.",
      zh: "BPC-157 + TB-500 恢复组合。",
    },
  },
  "pm-glow": {
    en: "GLOW is a multi-peptide blend of GHK-Cu, BPC-157, and TB-500. It combines copper-peptide signaling for collagen and skin remodeling with complementary tissue-repair peptides for cosmetic and recovery-oriented research use cases.",
    zh: "GLOW 是由 GHK-Cu、BPC-157 与 TB-500 组成的多肽组合。它将铜肽的胶原与皮肤重塑信号，与互补的组织修复肽结合，面向美容与恢复相关的研究场景。",
    brief: {
      en: "GHK-Cu + BPC-157 + TB-500 cosmetic/recovery blend.",
      zh: "GHK-Cu + BPC-157 + TB-500 美容恢复组合。",
    },
  },
  "pm-klow": {
    en: "KLOW is a multi-peptide blend of GHK-Cu, BPC-157, TB-500, and KPV. It combines copper-peptide skin remodeling, tissue-repair signaling, and the anti-inflammatory α-MSH fragment KPV for recovery and barrier-oriented research use cases.",
    zh: "KLOW 是由 GHK-Cu、BPC-157、TB-500 与 KPV 组成的多肽组合。它将铜肽皮肤重塑、组织修复信号，以及抗炎 α-MSH 片段 KPV 结合，面向恢复与屏障相关的研究场景。",
    brief: {
      en: "GHK-Cu + BPC-157 + TB-500 + KPV barrier blend.",
      zh: "GHK-Cu + BPC-157 + TB-500 + KPV 屏障组合。",
    },
  },
  "pm-pt141": {
    en: "PT-141 (Bremelanotide) is a synthetic cyclic heptapeptide melanocortin receptor agonist (primarily MC3R/MC4R). It acts centrally on sexual-arousal pathways and is distinct from peripheral vasodilator approaches.",
    zh: "PT-141（Bremelanotide）是一种合成环状七肽黑素皮质素受体激动剂（主要作用于 MC3R/MC4R）。它通过中枢性唤起通路发挥作用，有别于外周血管扩张类路径。",
    brief: {
      en: "Central melanocortin agonist for sexual arousal.",
      zh: "中枢黑素皮质素激动剂，用于性唤起。",
    },
  },
  "pm-dsip": {
    en: "DSIP (Delta Sleep-Inducing Peptide) is a nonapeptide originally isolated from rabbit cerebral venous blood. It is studied for sleep regulation, stress-response modulation, and neuroendocrine balancing effects.",
    zh: "DSIP（Delta Sleep-Inducing Peptide，δ 睡眠诱导肽）是最初从兔脑静脉血中分离的九肽。研究关注其睡眠调节、应激反应调制与神经内分泌平衡等作用。",
    brief: {
      en: "Sleep-regulating nonapeptide.",
      zh: "δ 睡眠诱导九肽。",
    },
  },
  "pm-kpv": {
    en: "KPV is a C-terminal tripeptide fragment (Lys-Pro-Val) of alpha-melanocyte-stimulating hormone (α-MSH). It is researched for anti-inflammatory signaling, gut mucosal support, and skin-barrier–related applications with reduced pigmentary activity versus parent melanocortins.",
    zh: "KPV 是 α-促黑素细胞激素（α-MSH）的 C 端三肽片段（Lys-Pro-Val）。研究关注其抗炎信号、胃肠黏膜支持与皮肤屏障相关应用，且相对母体黑素皮质素的色素活性更低。",
    brief: {
      en: "Anti-inflammatory α-MSH tripeptide fragment.",
      zh: "α-MSH 抗炎三肽片段。",
    },
  },
  "pm-epitalon": {
    en: "Epitalon (Ala-Glu-Asp-Gly) is a synthetic tetrapeptide modeled on Epithalamin from the pineal gland. It is studied for telomerase-related aging research, circadian/pineal signaling, and longevity-oriented peptide programs.",
    zh: "Epitalon（Ala-Glu-Asp-Gly）是基于松果体 Epithalamin 设计的合成四肽。研究关注端粒酶相关衰老、昼夜节律/松果体信号，以及长寿导向的肽类项目。",
    brief: {
      en: "Pineal tetrapeptide for aging and circadian research.",
      zh: "松果体源四肽，衰老与节律研究。",
    },
  },
  "pm-semax": {
    en: "Semax is a synthetic heptapeptide analogue derived from an ACTH(4-10) fragment (Met-Glu-His-Phe-Pro-Gly-Pro). It is researched as a nootropic/neuroprotective peptide affecting BDNF-related pathways, attention, and cognitive resilience.",
    zh: "Semax 是由 ACTH(4-10) 片段衍生的合成七肽类似物（Met-Glu-His-Phe-Pro-Gly-Pro）。研究将其作为益智/神经保护肽，关注 BDNF 相关通路、注意力与认知韧性。",
    brief: {
      en: "ACTH-derived nootropic/neuroprotective heptapeptide.",
      zh: "ACTH 衍生益智/神经保护七肽。",
    },
  },
  "pm-selank": {
    en: "Selank is a synthetic heptapeptide analogue of the immunomodulatory peptide tuftsin (Thr-Lys-Pro-Arg-Pro-Gly-Pro). It is studied for anxiolytic and nootropic effects, including modulation of monoamine and BDNF-related signaling.",
    zh: "Selank 是免疫调节肽 tuftsin 的合成七肽类似物（Thr-Lys-Pro-Arg-Pro-Gly-Pro）。研究关注其抗焦虑与益智作用，包括对单胺类及 BDNF 相关信号的调节。",
    brief: {
      en: "Tuftsin analogue with anxiolytic/nootropic effects.",
      zh: "Tuftsin 类似物，抗焦虑/益智。",
    },
  },
  "pm-ta1": {
    en: "Thymosin Alpha-1 (Ta1) is a 28-amino-acid peptide originally isolated from thymic tissue. It functions as an immune-modulating signal that supports T-cell maturation and innate/adaptive immune balance in research and clinical immunology contexts.",
    zh: "胸腺素 α-1（Thymosin Alpha-1，Ta1）是最初从胸腺组织分离的 28 氨基酸肽。它作为免疫调节信号，在研究与临床免疫学场景中支持 T 细胞成熟及固有/适应性免疫平衡。",
    brief: {
      en: "Thymic peptide modulating T-cell and immune balance.",
      zh: "胸腺免疫调节肽，支持 T 细胞成熟。",
    },
  },
  "pm-aod9604": {
    en: "AOD-9604 is a modified fragment of the C-terminal region of human growth hormone (hGH 177–191) with an additional tyrosine. It is researched for fat-metabolism signaling without the full growth-promoting profile of intact hGH.",
    zh: "AOD-9604 是人生长激素 C 端区域（hGH 177–191）的修饰片段，并额外引入酪氨酸。研究关注其脂肪代谢信号作用，而不具备完整 hGH 的全面促生长特征。",
    brief: {
      en: "hGH fragment for fat metabolism without full GH effects.",
      zh: "hGH 脂肪代谢片段，无全面促生长作用。",
    },
  },
  "pm-ss31": {
    en: "SS-31 (Elamipretide) is a mitochondria-targeting tetrapeptide that associates with cardiolipin on the inner mitochondrial membrane. It is studied for improving mitochondrial bioenergetics, reducing oxidative stress, and supporting cellular energy metabolism.",
    zh: "SS-31（Elamipretide）是靶向线粒体的四肽，可与线粒体内膜心磷脂结合。研究关注其改善线粒体生物能量学、降低氧化应激，以及支持细胞能量代谢。",
    brief: {
      en: "Mitochondria-targeting peptide (Elamipretide).",
      zh: "线粒体靶向肽 Elamipretide。",
    },
  },
  "pm-retatrutide": {
    en: "Retatrutide is an investigational triple agonist peptide targeting GIP, GLP-1, and glucagon receptors. It is studied for substantial metabolic effects on body weight, glycemic control, and energy expenditure.",
    zh: "Retatrutide 是一种在研的三重激动剂肽，靶向 GIP、GLP-1 与胰高血糖素受体。研究关注其对体重、血糖控制与能量消耗的显著代谢作用。",
    brief: {
      en: "Triple GIP/GLP-1/glucagon agonist for weight and glycemia.",
      zh: "GIP/GLP-1/胰高血糖素三重激动剂。",
    },
  },
  "pm-tirzepatide": {
    en: "Tirzepatide is a dual GIP/GLP-1 receptor agonist peptide used clinically for type 2 diabetes and chronic weight management. It enhances incretin signaling to improve glycemic control and reduce appetite/body weight.",
    zh: "Tirzepatide 是双重 GIP/GLP-1 受体激动剂肽，临床上用于 2 型糖尿病与慢性体重管理。它增强肠促胰岛素信号，以改善血糖控制并降低食欲/体重。",
    brief: {
      en: "Dual GIP/GLP-1 agonist for diabetes and weight management.",
      zh: "双重 GIP/GLP-1 激动剂，降糖减重。",
    },
  },
  "pm-semaglutide": {
    en: "Semaglutide is a long-acting GLP-1 receptor agonist peptide analogue of glucagon-like peptide-1. It improves glycemic control and supports weight reduction through incretin-pathway effects on insulin secretion and appetite regulation.",
    zh: "Semaglutide 是胰高血糖素样肽-1（GLP-1）的长效受体激动剂类似物。它通过肠促胰岛素通路影响胰岛素分泌与食欲调节，从而改善血糖控制并支持减重。",
    brief: {
      en: "Long-acting GLP-1 agonist for glycemia and weight loss.",
      zh: "长效 GLP-1 激动剂，降糖减重。",
    },
  },
  "pm-cagrilintide": {
    en: "Cagrilintide is a long-acting amylin analogue peptide. It acts on amylin receptors to promote satiety and slow gastric emptying, and is researched alone or with incretin agonists for obesity treatment.",
    zh: "Cagrilintide 是长效胰淀素（amylin）类似物肽。它作用于胰淀素受体以促进饱腹感并减缓胃排空，可单独或与肠促胰岛素激动剂联合用于肥胖治疗研究。",
    brief: {
      en: "Long-acting amylin analogue for satiety and obesity.",
      zh: "长效胰淀素类似物，增强饱腹感。",
    },
  },
  "pm-melanotan": {
    en: "Melanotan I / II are synthetic analogues of alpha-melanocyte-stimulating hormone (α-MSH) that activate melanocortin receptors. They are associated with melanogenesis (tanning) research; Melanotan II also has notable effects on sexual arousal pathways and carries higher regulatory/safety scrutiny.",
    zh: "Melanotan I / II 是 α-促黑素细胞激素（α-MSH）的合成类似物，可激活黑素皮质素受体。与黑色素生成（美黑）研究相关；Melanotan II 还对性唤起通路有显著影响，并面临更高的监管与安全性审视。",
    brief: {
      en: "α-MSH analogue for melanogenesis; MT-II also affects arousal.",
      zh: "α-MSH 类似物，美黑；MT-II 亦影响性唤起。",
    },
  },
};
