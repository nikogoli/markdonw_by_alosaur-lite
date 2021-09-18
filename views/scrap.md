# アドオン作成の手引っぽいもの：とりあえず
- 基本の基本：[[Blender] Blenderプラグインの作り方](https://qiita.com/nutti/items/a836391723bd28cd3e4c)
- 基本：[「はじめてのBlenderアドオン開発 (Blender 2.8版)」](https://colorful-pico.net/introduction-to-addon-development-in-blender/2.8/index.html)
- TomoG氏の： [Blenderでアドオンの作り方](https://www.tomog-storage.com/entry/Python-BlenderAddon-HowStarUp)
- 忘却野氏の： [アドオンの作り方・構造の解説](https://bookyakuno.com/blender-addon-making-tutorial/)
- dskjal氏の： [Blender 2.80 で UI のスクリプトを書く](https://dskjal.com/blender/ui-script-280.html)


<br><br>

ぬっち氏の「Blenderプラグインの作り方」の出来が良すぎて、これの2.8対応版[^1]があればそれで十分な感じはある[^2]


[^1]: 注釈テスト(文中)　時代は3.0だよ・・・
[^2]: 注釈テスト(文末)

<br>

--------

--------

<br>

# ◇ メニューの追加登録候補について(本体はまとめに移動)
* ユーザー設定 (`USERPREF`) はオペレーター関連 (`_OT_`) だけ `PREFERENCE`に分離されている
* メニューの `append・prepend・remove` は、`scripts/modules/bpy_types.py` で定義されているので、(たぶん)変更可能
  * → 同名のメニューを自作メニューで置き換えるとかできるかも？
  * `append`はこんな感じ
    ```python
    @classmethod
    def append(cls, draw_func):
        """
        Append a draw function to this menu,
        takes the same arguments as the menus draw function
        """
        draw_funcs = cls._dyn_ui_initialize()
        cls._dyn_owner_apply(draw_func)
        draw_funcs.append(draw_func)
      ```
  * ちなみに、`context.copy()`もこのファイルで定義されていた


<br>

--------

--------

<br>

# オペレーターやクラスのプロパティの情報を取得したい
`bpy.types.SubsurfModifier`の`boundary_smooth`の`PRESERVE_CORNERS`の説明文や、` bpy.ops.object.data_transfer`の`vert_mapping`の`EDGEINTERP_NEAREST`の説明文を流用したいが、いちいち API Document をコピペするのはちょっと...　というとき

◇ **`types.Hoge`がある場合**
```python
struct = bpy.types.SubsurfModifier.bl_rna  #.bl_rna で bpy_struct を取得
prop = struct.properties['boundary_smooth']  # properties["名前"] でプロパティを取得
text = prop.enum_items['PRESERVE_CORNERS'].description  #Enum の場合はこんな感じ
```

◇ **`types.Hoge`がない場合(オペレーター)**
```python
struct = bpy.ops.object.data_transfer.get_rna_type()  #.get_rna_type() で bpy_struct を取得
prop = struct.properties['vert_mapping']  # あとは types.Hoge と同じ
text = prop.enum_items['EDGEINTERP_NEAREST'].description
```

参考：[How can I access view3d.select_circle radius value?](https://blender.stackexchange.com/questions/163129/how-can-i-access-view3d-select-circle-radius-value/163130#163130])

同様にして`struct.functions`でメソッドが取れた　はず

<br><br>

コピペでは駄目な理由：「同じテキスト(のはず)なのに、なぜか違う訳になる」という現象


例(2.91で発生、2.92は未確認)
```python: 適当なアドオンの中
class AddonPreferences(bpy.types.AddonPreferences):
    bl_idname = __name__

    def draw(self, context):
        txt_solid=bpy.types.UILayout.enum_item_name(context.active_object, 'display_type', 'SOLID')
        self.layout.label(text=txt_solid)  #これは「ソリッド」と翻訳される
        self.layout.label(text="Solid")  #これも「ソリッド」と翻訳される
        self.layout.operator("何かのオペレーター", text=txt_solid)  #これは「ソリッド」と翻訳される
        self.layout.operator("何かのオペレーター", text="Solid")  #これは「立体」と翻訳される
```
翻訳 context のパラメータ設定が違うのかな？

<br>

--------

--------

<br>

# ◇ Blender のスクリーンショット作成機能とか
* python のテストではアドオンの機能テストはできるけどパネル表示のテストはできないよね問題の解決に使えないか？
  * と思ったけどやっぱ無理？ invoke_default → スクショ →  キャンセルってできるんだろうか
* UI というか各エディターの基本状態の画像一覧をこれで自動的に作りたい
* あと mouse_gesture でやってるやつ
  * これはスクリーンショット機能使ってなかったかも

<br><br>

~~Blender のスクリーンショット作成機能では、UIは映らないっぽい~~　勘違いだった
* エディターの基本状態の画像 →　できる
* invoke_default してスクリーンショット  →　ボタン経由では可能、draw での自動実行は不可能
  >  Calling operator "bpy.ops.screen.screenshot" error, can't modify blend data in this state (drawing/rendering)


<br><br>

これに限らず、「invoke でポップアップ出す → 処理を自動で実行する」のはどうすればいいんだろ
* app.tymer ？