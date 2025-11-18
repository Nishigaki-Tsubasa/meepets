import React from "react";
import { useNavigate } from "react-router-dom";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { getAuth } from "firebase/auth";

const WalkCard = ({ walk, onLike }) => {
    const navigate = useNavigate();
    const auth = getAuth();
    const user = auth.currentUser;

    const isLiked = walk.likes?.includes(user?.uid);

    // 色をここでまとめて管理（import 不要）
    const COLORS = {
        textDark: "#555",
        textLight: "#777",
        shadow: "rgba(0,0,0,0.1)",
        shadowHover: "rgba(0,0,0,0.2)",
    };

    const handleLike = (e) => {
        e.stopPropagation();
        if (onLike) onLike(walk.id, walk.likes);
    };

    return (
        <div
            className="walk-card"
            onClick={() => navigate(`/home/walkDetail/${walk.id}`)}
            style={{
                cursor: "pointer",
                borderRadius: "15px",
                overflow: "hidden",
                boxShadow: `0 2px 10px ${COLORS.shadow}`,
                transition: "transform 0.2s, boxShadow 0.2s",
                marginBottom: "1rem",
                display: "flex",
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = `0 8px 20px ${COLORS.shadowHover}`;
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = `0 2px 10px ${COLORS.shadow}`;
            }}
        >
            {/* 左側の画像（デフォルト画像使用） */}
            <div style={{ flex: "0 0 120px", position: "relative" }}>
                <img
                    src={walk.pet?.petImage || "/images.jpg"}
                    alt="pet"
                    style={{
                        width: "120px",
                        height: "120px",
                        objectFit: "cover",
                        borderRadius: "15px 0 0 15px",
                    }}
                />
            </div>

            {/* 右側のテキスト */}
            <div style={{ flex: "1", padding: "10px" }}>
                {/* 投稿者名 */}
                <h5
                    style={{
                        margin: "0 0 4px 0",
                        fontSize: "1rem",
                        fontWeight: "bold",
                    }}
                >
                    {walk.username} さん
                </h5>

                {/* 場所 */}
                <p
                    style={{
                        margin: "0 0 4px 0",
                        fontSize: "0.85rem",
                        color: COLORS.textDark,
                    }}
                >
                    {walk.location}
                </p>

                {/* 開始時間 */}
                <p
                    style={{
                        margin: 0,
                        fontSize: "0.75rem",
                        color: COLORS.textLight,
                    }}
                >
                    {walk.startTime?.toDate().toLocaleString("ja-JP", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                    })}
                </p>
            </div>
        </div>
    );
};

export default WalkCard;
