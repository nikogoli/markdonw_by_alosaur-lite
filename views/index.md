
!!! info "このページについて"
	* 以下は、公式 API Document の [Gotcha's](https://docs.blender.org/api/current/info_gotcha.html#edit-bones-pose-bones-bone-bones) をベースに自分が調べた内容を整理したもので、正しさは保証しない
	* スクリプトによるボーンの操作のついての情報が欲しい場合は、[dskjalさんの解説](https://dskjal.com/blender/bone-script.html)などを参照するほうが良い
	* 本文中のコードは、`bpy.context.object`がアーマチュアオブジェクトである状態を前提としている
<br>

# ボーンの3種類のデータ構造：Bone, EditBone, PoseBone

アーマチュアボーンには、**Bone**, **EditBone**, **PoseBone**という3つの異なるデータ構造がある。<br>

簡単に言えば、それぞれオブジェクトモード、編集モード、ポーズモードで扱うボーンのデータである。各モードでのプロパティエディタのボーンタブは、(基本的には)それぞれ対応するデータ構造の中身を示している[^1] 。

[^1]: ツールチップを見ればわかるが、実際は別のデータ構造のプロパティも並んでいたりする


この3つのデータ構造は、保有するプロパティや変更できるプロパティにそれぞれ違いがある。

例えば、ポーズモードで利用する PoseBone は、`select` プロパティを持たない。<br>
そのため、スクリプト内で選択状態を変更するときは、 対象ボーンの PoseBone ではなく Bone にアクセスし、その`select`プロパティを変更することが必要になる。<br><br>



Bone, EditBone, PoseBone の違いを大雑把にまとめると、以下のようになる。

![データ構造の関係](https://user-images.githubusercontent.com/49331838/109383130-c0c8c280-7927-11eb-8e24-42007a7102dc.png)

したがって、データ構造と使用場面は、基本的には以下のように対応する。

* ボーン自体のデータを変更したいとき　→　**EditBone**
* ポーズのデータを変更したいとき　→　**PoseBone**
* モードを切り替えずにボーンのデータを変更したいとき　→　**Bone**<br><br>



## [Bone](https://docs.blender.org/api/current/bpy.types.Bone.html)

**Bone** はボーンのデータ構造で1つであり、オブジェクトモードとポーズモードで利用される。

??? note "編集モードでの Bone"

	Bone データは編集モードでもアクセス可能で、プロパティを変更することもできる。しかし

	* Bone で変更できるプロパティは、EditBone でも変更できる
	* 編集モード中の Bone での変更は EditBone には反映されずない
	* 変更した Bone のプロパティは、編集モードを抜ける際に EditBone の値で上書きされる (=もとに戻る)

	という性質があるため、わざわざ Bone データにアクセスする必要は無いと思われる


context を利用して単一の Bone にアクセスする場合、一般的な手法としては3つの手法がある。

``` python
# active_bone を使う ( オブジェクトモード or ポーズモード )
bone = bpy.context.active_bone

# アーマチュアデータの bones プロパティの、active プロパティを使う
bone = bpy.context.active_object.data.bones.active

# アーマチュアデータの bones プロパティの中身を、ボーン名を指定して取り出す
bone = bpy.context.active_object.data.bones["name"]
```
<br>

### ◇ 他のデータ構造と比べたときの Bone の特徴
------------------------
対 EditBone

* 同じ点：ボーンそのものに関する基本的な情報を持っている
* 違う点：どんなモードでもアクセスできる　しかし、変更可能なプロパティは少ない<br><br>

対 PoseBone

* 同じ点：どんなモードでもアクセスできる
* 違う点：ボーンそれ自体に関するデータを持つ　しかし、ポーズに関するデータを持たない<br><br>



### ◇ Bone の利用
------------------------

「いつでもアクセスできる + ボーン自体を操作できる」という Bone の性質は、特にポーズモードにおいて役立つ。

実際、ポーズモードの ボーンタブで行ういくつかの操作は、アクティブなボーンの PoseBone ではなく Bone のプロパティを変更している。例えば、「変形」の有効化/無効化、アーマチュアのレイヤーの切り替えなどのツールチップを見ると、`pose.bones["~~"].xx`ではなく、`armatures["~~"].bones["~~"].xx`にアクセスしていることがわかる。<br><br>



## [Edit Bone](https://docs.blender.org/api/current/bpy.types.EditBone.html)


**EditBone** はボーンのデータ構造で1つであり、編集モードで利用される。<br>

EditBone は編集モードへの切り替えが行われた際に Bone のデータを利用して準備され、編集モードから出るとアクセスできなくなる[^2]。


[^2]: 編集モードで作成した参照は、少なくともコンソールでは編集モードを出たあとも利用できる。ただし EditBone のみが変更可能なプロパティを変更しようとすると Blender がクラッシュする

??? warning "編集モードへの / からの切り替えを行ったときは、参照を取得し直す"

	[Gotcha's](https://docs.blender.org/api/current/info_gotcha.html#edit-mode-memory-access) で説明されているように、モードの切り替えが起こると、データの re-allocate が行われるため、参照先が変わってしまう。

	これはコンソールでも、以下のようにすれば確認できる。

	1. オブジェクトモードで `b = C.active_bone` してから`b`を実行し、参照先を確認する
	2. 編集モードに切り替え、何もせずにオブジェクトモードに戻す
	3. `b`の参照先を確認すると、別のボーンになっている場合がある (ときには存在しないものになる)

	なので、編集モードを出たあともボーンを操作する場合は、name などで再取得したほうが良い



context を利用して単一の EditBone にアクセスする場合、一般的な手法としては3つの手法がある。

```python
# active_bone を使う ( 編集モードのみ )
edit_bone = bpy.context.active_bone

# アーマチュアデータの edit_bones プロパティの、active プロパティを使う
edit_bone = bpy.context.active_object.data.edit_bones.active

# アーマチュアデータの edit_bones プロパティの中身を、ボーン名を指定して取り出す
edit_bone = bpy.context.active_object.data.bones["name"]

# 編集モード以外では、アーマチュアデータの`edit_bones`プロパティの要素は空
len(bpy.context.active_object.data.edit_bones) == 0  # True
```

なお、アーマチュアデータの `edit_bones`プロパティは、ボーンの追加や削除にも利用される

```python
# ボーンの追加：他のモードでは RuntimeError
new_bone = bpy.context.active_object.data.edit_bones.new(name="new_bone")
```
<br>

### ◇ 他のデータ構造と比べたときの EditBone の特徴
-----------------------
対 Bone

* 同じ点：ボーンそのものに関する基本的な情報を持っている
* 違う点：変更可能なプロパティが多い　しかし、編集モード以外ではアクセスできない<br><br>

対 PoseBone

* 同じ点：特に無し[^3]
* 違う点：変更できるデータの対象 + 利用できるモード<br><br>

[^3]: この2つが同じように変更できるものは、おそらくボーンの名前だけ。もしかしたら行列関係で何かあるかもしれない。


### ◇ EditBone の利用
-----------------------
EditBone のみで変更できる重要なプロパティには、以下のようなものがある

* `head`/ `tail`：ボーンそのものの位置や長さの設定
* `roll`：ボーンのロールの変更
* `parent`：親子関係の変更
* `use_connect`：親ボーンとの接続の有無<br><br>



## [Pose Bone](https://docs.blender.org/api/current/bpy.types.Pose.html)

**PoseBone** はボーンのデータ構造で1つであり、ポーズモードで利用される。<br>

PoseBone は(おそらく) Bone に基づいて作成/更新され[^4]、ポーズモード以外でもアクセスしてプロパティを変更することができる。

[^4]: 実際は編集モードを出る際に Bone か EditBone の状態に基づいて作成されるようで、編集モードにいる限りどれだけボーンを追加/削除しても`pose.bones`には反映されない。編集モードで削除したボーンの`PoseBone.bone`から Bone へのアクセスはできる。プロパティの変更を試すと、エラーは出ないものの値は変更されない。

EditBone と異なり PoseBone はどのモードでも存在しているため、別モードでの変更もポーズモードに反映される。

context を利用して単一の PoseBone にアクセスする場合、一般的な手法としては2つの手法がある。
```python
# active_pose_bone を使う　ポーズモード以外では None 
poset_bone = bpy.context.active_pose_bone

# オブジェクトのポーズデータの pose_bones プロパティの中身を、ボーン名を指定して取り出す
pose_bone = bpy.context.active_object.pose.bones["name"]
```
<br>

???+ abstract "PoseBone とは実際にはボーンではなく、単なるポーズ"

	Bone や EditBone は、アーマチュアデータ (`object.data`) の下には格納される。<br>
	しかし以下のアウトライナーが示すように、PoseBone はポーズデータ (`object.pose`) の下に格納される。<br>
	![bone_outliner](https://user-images.githubusercontent.com/49331838/109387214-6ccbd700-7943-11eb-88df-7e790bf95c72.png)

	つまり、厳密に言えば PoseBone はボーンではなく、`bpy.types.Object`に格納されたアーマチュアの**各部分の状態**[^5]のデータである。


	[^5]: 原文のstateをそのまま訳してしまったが、それこそ"姿勢"とするべきかも

そのため、PoseBone 自体は 選択/非選択 や アクティブ といった性質を持たない。<br>
これらの性質は同一ボーンの Bone データがそのまま反映されることになるので、選択状態などの変更は、PoseBone の`bone`プロパティを利用して、Bone にアクセスして行うことが必要。

```python
# 一部の PoseBone を選択状態にして処理を実行したいとき
for pb in [PoseBone のリスト]:
    pb.bone.select = True		# Bone にアクセスしてその選択状態を変更
bpy.ops.pose.xxx_yyy()			#なにかの処理
```
<br>

### ◇ 他のデータ構造と比べたときの PoseBone の特徴
-------------------------
対 Bone

* 同じ点：どんなモードでもアクセスできる
* 違う点：ポーズに関するデータを持つ　しかし、ボーンそれ自体に関するデータを持たない<br><br>

対 EditBone

* 同じ点：特に無し
* 違う点：変更できるデータの対象 + 利用できるモード<br><br>


### ◇ PoseBoneの利用
----------------------------
PoseBone のみで変更できるプロパティは多く、以下のようなものが該当する。

* 位置・回転・拡縮などの、アニメーション可能な変形の情報
* IKの制限に関する設定
* カスタムシェイプの設定
* ボーングループの設定
* ボーンの持つポーズコンストレイントへのアクセス<br><br>


なお、ベンディボーンに関する設定には、以下の2種類が存在する。

1. ボーン側 (Bone/EditBone) にのみ存在し、ポーズ側はその値を利用する設定
2. ボーン側とポーズ側 (PoseBone) の両方に存在し、それぞれ別の値を保持する設定

後者のタイプの設定は、プロパティエディタのボーンタブにおいて、ポーズモードでもオブジェクトモードでも**常にポーズ側の値が表示されてボーン側の値は見えない**という性質[^6]を持つので注意する。

[^6]: 編集モードに切り替えてタブがEditBoneのデータ基準になると、表示される
