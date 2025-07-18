import React, { useState, useEffect } from "react";
import {
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from "react-native";
import * as S from "../../styles/pages/write-post";
import { PrimaryButton } from "../../components/button/PrimaryButton";
import { useRouter, useLocalSearchParams } from "expo-router";
import Entypo from "@expo/vector-icons/Entypo";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import DraggableFlatList, {
  RenderItemParams,
} from "react-native-draggable-flatlist";
import ImageViewing from "react-native-image-viewing";
import { uploadPost } from "@/services/post";
import axios, { Axios } from "axios";
import { api } from "@/libs/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SecondaryButton } from "@/components/button/SecondaryButton";

const categories = [
  "전체",
  "아르바이트",
  "단기알바",
  "프리랜서",
  "외주",
  "채용",
  "재택알바",
];

export default function WritePostPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tag, setTag] = useState("");

  const [isPickerShow, setPickerShow] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [buttonCategory, setButtonCategory] = useState<"구인" | "구직" | null>(
    null
  );

  const getFileExtension = (uri: string): string => {
    try {
      const cleanUri = uri.split("?")[0];
      const extMatch = cleanUri.match(/\.(\w+)$/);
      return extMatch ? extMatch[1].toLowerCase() : "jpg";
    } catch {
      return "jpg";
    }
  };

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert("이미지 접근 권한이 필요합니다.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
      selectionLimit: 10 - images.length,
    });
    if (!result.canceled && result.assets) {
      const uris = result.assets.map((asset) => asset.uri).filter(Boolean);
      setImages((prev) => [...prev, ...uris].slice(0, 10));
    }
  };

  const handleRemoveImage = (idx: number) => {
    Alert.alert("이미지 삭제", "정말로 이미지를 지우시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: () => {
          setImages((prev) => prev.filter((_, i) => i !== idx));
        },
      },
    ]);
  };

  const handlePreview = (idx: number) => {
    setPreviewIndex(idx);
    setPreviewVisible(true);
  };

  const renderImageItem = ({
    item,
    drag,
    isActive,
  }: RenderItemParams<string>) => {
    const idx = images.indexOf(item);
    return (
      <View style={{ width: 80, height: 80, marginRight: 8 }}>
        <TouchableOpacity
          onLongPress={drag}
          onPress={() => handlePreview(idx)}
          disabled={isActive}
          activeOpacity={0.8}
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 8,
            overflow: "hidden",
            position: "relative",
          }}
        >
          <Image
            source={{ uri: item }}
            style={{
              width: "100%",
              height: "100%",
              opacity: isActive ? 0.7 : 1,
            }}
          />
          <TouchableOpacity
            onPress={() => handleRemoveImage(idx)}
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: "rgba(0,0,0,0.6)",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1,
            }}
          >
            <Entypo name="cross" size={12} color="white" />
          </TouchableOpacity>
        </TouchableOpacity>
      </View>
    );
  };

  const postMutation = useMutation({
    mutationFn: async (postPayload: any) => {
      await uploadPost(postPayload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boards"] });
      Alert.alert("✅ 게시글 등록 완료", "게시글이 성공적으로 등록되었어요!");
      router.replace("/community");
    },
    onError: (error: any) => {
      Alert.alert(
        "⚠️ 등록 실패",
        error?.response?.data?.message || "알 수 없는 오류가 발생했어요"
      );
      if (axios.isAxiosError(error)) {
        console.log(error.response);
      }
    },
  });

  const handleSubmit = async () => {
    
    if (!title.trim()) {
      Alert.alert("⚠️ 제목 누락", "제목을 입력해주세요!");
      return;
    }
    if (!content.trim()) {
      Alert.alert("⚠️ 내용 누락", "내용을 입력해주세요!");
      return;
    }

    try {
      const formData = new FormData();

      images.forEach((uri, index) => {
        const ext = getFileExtension(uri);
        const mimeType = `image/${ext === "jpg" ? "jpeg" : ext}`;

        formData.append("files", {
          uri,
          name: `image_${index}.${ext}`,
          type: mimeType,
        } as any);
      });

      const imageRes = await api.axiosInstance.post("/post/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const tagArray = tag
        .split(/[\s,]+/)
        .filter((t) => t.length > 0)
        .map((t) => t.replace(/^#/, ""));

        
      const res = await api.axiosInstance.post("/board", {
        "title":title,
        "content":content,
        "tag": tagArray,
        "images":imageRes.data
      });
      
      
      router.replace("/community");
    } catch (error: any) {
      Alert.alert(
        "⚠️ 등록 실패",
        error?.response?.data?.message || "알 수 없는 오류가 발생했어요"
      );
      if (axios.isAxiosError(error)) {
        console.log(error.response);
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <S.Container>
        <SafeAreaView style={{ flex: 1 }}>
          <S.Header>
            <S.BackButton onPress={()=>{
              router.dismiss();
            }}>
              <Entypo name="chevron-thin-left" size={22} color="black" />        
            </S.BackButton>
            <S.HeaderTitle>자격증 선택</S.HeaderTitle>
          </S.Header>
          <S.Form>
            <S.ImagePickerContainer>
              <View style={{ width: "100%" }}>
                <DraggableFlatList
                  data={images}
                  horizontal
                  showsHorizontalScrollIndicator={true}
                  onDragEnd={({ data }) => setImages(data)}
                  keyExtractor={(item) => item}
                  renderItem={renderImageItem}
                  style={{ height: 80 }}
                  contentContainerStyle={{ flexDirection: "row" }}
                  ListHeaderComponent={
                    <S.ImagePicker
                      onPress={pickImage}
                      style={{
                        width: 80,
                        height: 80,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Entypo name="camera" size={22} color="#d1d5db" />
                      <S.ImagePickerText>{images.length}/10</S.ImagePickerText>
                    </S.ImagePicker>
                  }
                />
                <ImageViewing
                  images={images.map((uri) => ({ uri }))}
                  imageIndex={previewIndex}
                  visible={previewVisible}
                  onRequestClose={() => setPreviewVisible(false)}
                  swipeToCloseEnabled={true}
                  doubleTapToZoomEnabled={true}
                />
              </View>
            </S.ImagePickerContainer>

            <S.InputContainer>
              <S.InputLabel>제목</S.InputLabel>
              <S.TextInput
                value={title}
                onChangeText={setTitle}
                autoCapitalize="none"
                placeholder="제목을 입력해주세요!"
              />
            </S.InputContainer>

            <S.InputContainer>
              <S.InputLabel>내용</S.InputLabel>
              <S.TextArea
                value={content}
                onChangeText={setContent}
                autoCapitalize="none"
                placeholder="내용을 작성해주세요!"
                multiline
                textAlignVertical="top"
              />
            </S.InputContainer>
            <S.InputContainer>
              <S.InputLabel>태그</S.InputLabel>
              <S.TextArea
                value={tag}
                onChangeText={setTag}
                autoCapitalize="none"
                placeholder="#태그를 작성해주세요!"
                multiline
                textAlignVertical="top"
              />
            </S.InputContainer>
          </S.Form>
        </SafeAreaView>

        <S.ButtonContainer>
          <PrimaryButton text="작성" action={handleSubmit} />
        </S.ButtonContainer>
      </S.Container>
    </KeyboardAvoidingView>
  );
}
