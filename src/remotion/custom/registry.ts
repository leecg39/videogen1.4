// Custom TSX scenes — R6 ε 실험 → R10 DSL 폐기 선언 후 표준.
// scene-grammar.md v1.4 원칙 A: TSX 기본값 + 74 노드는 _dsl.tsx adapter 로 보존.
import type React from "react";
import type { NodeProps } from "@/types/stack-nodes";

import { Scene00 } from "./scene-00";
import { Scene01 } from "./scene-01";
import { Scene02 } from "./scene-02";
import { Scene03 } from "./scene-03";
import { Scene04 } from "./scene-04";
import { Scene05 } from "./scene-05";
import { Scene06 } from "./scene-06";
import { Scene07 } from "./scene-07";
import { Scene08 } from "./scene-08";
import { Scene09 } from "./scene-09";
import { Scene10 } from "./scene-10";
import { Scene11 } from "./scene-11";
import { Scene12 } from "./scene-12";
import { Scene13 } from "./scene-13";
import { Scene14 } from "./scene-14";
import { Scene15 } from "./scene-15";
import { Scene16 } from "./scene-16";
import { Scene17 } from "./scene-17";
import { Scene19 } from "./scene-19";
import { Scene20 } from "./scene-20";
import { Scene21 } from "./scene-21";
import { Scene22 } from "./scene-22";
import { Scene23 } from "./scene-23";
import { Scene24 } from "./scene-24";
import { Scene25 } from "./scene-25";
import { Scene26 } from "./scene-26";
import { Scene28 } from "./scene-28";
import { Scene29 } from "./scene-29";
import { Scene30 } from "./scene-30";
import { Scene31 } from "./scene-31";
import { Scene32 } from "./scene-32";
import { Scene34 } from "./scene-34";
import { Scene35 } from "./scene-35";
import { Scene36 } from "./scene-36";
import { Scene37 } from "./scene-37";
import { Scene38 } from "./scene-38";
import { Scene40 } from "./scene-40";
import { Scene41 } from "./scene-41";
import { Scene42 } from "./scene-42";
import { Scene44 } from "./scene-44";
import { Scene50 } from "./scene-50";
import { Scene51 } from "./scene-51";
import { Scene52 } from "./scene-52";
import { Scene53 } from "./scene-53";
import { Scene54 } from "./scene-54";
import { Scene56 } from "./scene-56";
import { Scene60 } from "./scene-60";
import { Scene65 } from "./scene-65";
import { Scene66 } from "./scene-66";
import { Scene68 } from "./scene-68";
import { Scene69 } from "./scene-69";
import { Scene70 } from "./scene-70";
import { Scene72 } from "./scene-72";
import { Scene75 } from "./scene-75";
import { Scene76 } from "./scene-76";
import { Scene77 } from "./scene-77";

// anxious-claude-0420 project (35-scene series on AI prompting anxiety)
import { AnxiousScene01 } from "./anxious/scene-01";
import { AnxiousScene02 } from "./anxious/scene-02";
import { AnxiousScene03 } from "./anxious/scene-03";
import { AnxiousScene04 } from "./anxious/scene-04";
import { AnxiousScene05 } from "./anxious/scene-05";
import { AnxiousScene06 } from "./anxious/scene-06";
import { AnxiousScene07 } from "./anxious/scene-07";
import { AnxiousScene08 } from "./anxious/scene-08";
import { AnxiousScene09 } from "./anxious/scene-09";
import { AnxiousScene10 } from "./anxious/scene-10";
import { AnxiousScene11 } from "./anxious/scene-11";
import { AnxiousScene12 } from "./anxious/scene-12";
import { AnxiousScene13 } from "./anxious/scene-13";
import { AnxiousScene14 } from "./anxious/scene-14";
import { AnxiousScene15 } from "./anxious/scene-15";
import { AnxiousScene16 } from "./anxious/scene-16";
import { AnxiousScene17 } from "./anxious/scene-17";
import { AnxiousScene18 } from "./anxious/scene-18";
import { AnxiousScene19 } from "./anxious/scene-19";
import { AnxiousScene20 } from "./anxious/scene-20";
import { AnxiousScene21 } from "./anxious/scene-21";
import { AnxiousScene22 } from "./anxious/scene-22";
import { AnxiousScene23 } from "./anxious/scene-23";
import { AnxiousScene24 } from "./anxious/scene-24";
import { AnxiousScene25 } from "./anxious/scene-25";
import { AnxiousScene26 } from "./anxious/scene-26";
import { AnxiousScene27 } from "./anxious/scene-27";
import { AnxiousScene28 } from "./anxious/scene-28";
import { AnxiousScene29 } from "./anxious/scene-29";
import { AnxiousScene30 } from "./anxious/scene-30";
import { AnxiousScene31 } from "./anxious/scene-31";
import { AnxiousScene32 } from "./anxious/scene-32";
import { AnxiousScene33 } from "./anxious/scene-33";
import { AnxiousScene34 } from "./anxious/scene-34";
import { AnxiousScene35 } from "./anxious/scene-35";

export const CUSTOM_COMPONENTS: Record<string, React.FC<NodeProps>> = {
  "scene-00": Scene00,
  "scene-01": Scene01,
  "scene-02": Scene02,
  "scene-03": Scene03,
  "scene-04": Scene04,
  "scene-05": Scene05,
  "scene-06": Scene06,
  "scene-07": Scene07,
  "scene-08": Scene08,
  "scene-09": Scene09,
  "scene-10": Scene10,
  "scene-11": Scene11,
  "scene-12": Scene12,
  "scene-13": Scene13,
  "scene-14": Scene14,
  "scene-15": Scene15,
  "scene-16": Scene16,
  "scene-17": Scene17,
  "scene-19": Scene19,
  "scene-20": Scene20,
  "scene-21": Scene21,
  "scene-22": Scene22,
  "scene-23": Scene23,
  "scene-24": Scene24,
  "scene-25": Scene25,
  "scene-26": Scene26,
  "scene-28": Scene28,
  "scene-29": Scene29,
  "scene-30": Scene30,
  "scene-31": Scene31,
  "scene-32": Scene32,
  "scene-34": Scene34,
  "scene-35": Scene35,
  "scene-36": Scene36,
  "scene-37": Scene37,
  "scene-38": Scene38,
  "scene-40": Scene40,
  "scene-41": Scene41,
  "scene-42": Scene42,
  "scene-44": Scene44,
  "scene-50": Scene50,
  "scene-51": Scene51,
  "scene-52": Scene52,
  "scene-53": Scene53,
  "scene-54": Scene54,
  "scene-56": Scene56,
  "scene-60": Scene60,
  "scene-65": Scene65,
  "scene-66": Scene66,
  "scene-68": Scene68,
  "scene-69": Scene69,
  "scene-70": Scene70,
  "scene-72": Scene72,
  "scene-75": Scene75,
  "scene-76": Scene76,
  "scene-77": Scene77,

  // anxious-claude-0420
  "anxious-01": AnxiousScene01,
  "anxious-02": AnxiousScene02,
  "anxious-03": AnxiousScene03,
  "anxious-04": AnxiousScene04,
  "anxious-05": AnxiousScene05,
  "anxious-06": AnxiousScene06,
  "anxious-07": AnxiousScene07,
  "anxious-08": AnxiousScene08,
  "anxious-09": AnxiousScene09,
  "anxious-10": AnxiousScene10,
  "anxious-11": AnxiousScene11,
  "anxious-12": AnxiousScene12,
  "anxious-13": AnxiousScene13,
  "anxious-14": AnxiousScene14,
  "anxious-15": AnxiousScene15,
  "anxious-16": AnxiousScene16,
  "anxious-17": AnxiousScene17,
  "anxious-18": AnxiousScene18,
  "anxious-19": AnxiousScene19,
  "anxious-20": AnxiousScene20,
  "anxious-21": AnxiousScene21,
  "anxious-22": AnxiousScene22,
  "anxious-23": AnxiousScene23,
  "anxious-24": AnxiousScene24,
  "anxious-25": AnxiousScene25,
  "anxious-26": AnxiousScene26,
  "anxious-27": AnxiousScene27,
  "anxious-28": AnxiousScene28,
  "anxious-29": AnxiousScene29,
  "anxious-30": AnxiousScene30,
  "anxious-31": AnxiousScene31,
  "anxious-32": AnxiousScene32,
  "anxious-33": AnxiousScene33,
  "anxious-34": AnxiousScene34,
  "anxious-35": AnxiousScene35,
};
