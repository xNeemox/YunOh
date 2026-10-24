import React, { useState } from "react";
import { UserPlus, UserCheck } from "lucide-react";
import "./FollowButton.css";

export default function FollowButton({
  initialFollowState = false,
  initialCount = 12,
}) {
  const [isFollowing, setIsFollowing] = useState(initialFollowState);
  const [followerCount, setFollowerCount] = useState(initialCount);

  const handleToggleFollow = () => {
    if (isFollowing) {
      setIsFollowing(false);
      setFollowerCount((prev) => Math.max(0, prev - 1));
    } else {
      setIsFollowing(true);
      setFollowerCount((prev) => prev + 1);
    }
  };

  return (
    <div className="follow-container">
      <button
        onClick={handleToggleFollow}
        className={`follow-btn ${isFollowing ? "following" : ""}`}
      >
        {isFollowing ? <UserCheck size={14} /> : <UserPlus size={14} />}
        {isFollowing ? "Following" : "Follow"}
      </button>
    </div>
  );
}
