# -*- coding: utf-8 -*-
"""
星5武器名を抽出するスクリプト
gamewithのデータから武器名を抽出して別ファイルに保存する

パターン:
- 「X.X点」の行の1行上に武器名がある
- 武器名は「〇〇のアイコン」の後から、行末まで（タブ以前）
"""

import re

input_file = r'c:\work\【lighthouse-projects】\dqwfuntool_MonsterWalker\documents\星5武器_gamewith_work.txt'
output_file = r'c:\work\【lighthouse-projects】\dqwfuntool_MonsterWalker\documents\星5武器名一覧_gamewith.txt'

with open(input_file, 'r', encoding='utf-8') as f:
    lines = f.readlines()

weapons = []
for i, line in enumerate(lines):
    # 点数行のパターン（X.X点 または X点）
    if re.match(r'^\d+\.?\d*点$', line.strip()):
        # 1行上を確認
        if i > 0:
            prev_line = lines[i-1].strip()
            # 「〇〇のアイコン武器名」のパターンから武器名を抽出
            # タブで区切られている場合は最初の部分を取得
            first_col = prev_line.split('\t')[0]
            # 「のアイコン」の後ろの部分を取得
            match = re.search(r'のアイコン(.+)$', first_col)
            if match:
                weapon_name = match.group(1)
                if weapon_name and weapon_name not in weapons:
                    weapons.append(weapon_name)

# 結果を出力
print(f'抽出した武器数: {len(weapons)}')
for i, w in enumerate(weapons[:20], 1):
    print(f'{i}. {w}')
if len(weapons) > 20:
    print(f'... 他 {len(weapons) - 20} 件')

# ファイルに保存
with open(output_file, 'w', encoding='utf-8-sig') as f:
    for weapon in weapons:
        f.write(weapon + '\n')

print(f'\n保存先: {output_file}')
