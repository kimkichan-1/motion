import { useState } from 'react';

export interface BoneConfig {
  flipX: boolean;
  flipY: boolean;
  flipZ: boolean;
  defaultDirX: number;
  defaultDirY: number;
  defaultDirZ: number;
}

export interface MappingConfig {
  leftArm: BoneConfig;
  leftForeArm: BoneConfig;
  rightArm: BoneConfig;
  rightForeArm: BoneConfig;
  leftUpLeg: BoneConfig;
  leftLeg: BoneConfig;
  rightUpLeg: BoneConfig;
  rightLeg: BoneConfig;
}

export const defaultConfig: MappingConfig = {
  leftArm: { flipX: false, flipY: true, flipZ: true, defaultDirX: -1, defaultDirY: 0, defaultDirZ: 0 },
  leftForeArm: { flipX: false, flipY: true, flipZ: true, defaultDirX: -1, defaultDirY: 0, defaultDirZ: 0 },
  rightArm: { flipX: false, flipY: true, flipZ: true, defaultDirX: 1, defaultDirY: 0, defaultDirZ: 0 },
  rightForeArm: { flipX: false, flipY: true, flipZ: true, defaultDirX: 1, defaultDirY: 0, defaultDirZ: 0 },
  leftUpLeg: { flipX: false, flipY: true, flipZ: true, defaultDirX: 0, defaultDirY: -1, defaultDirZ: 0 },
  leftLeg: { flipX: false, flipY: true, flipZ: true, defaultDirX: 0, defaultDirY: -1, defaultDirZ: 0 },
  rightUpLeg: { flipX: false, flipY: true, flipZ: true, defaultDirX: 0, defaultDirY: -1, defaultDirZ: 0 },
  rightLeg: { flipX: false, flipY: true, flipZ: true, defaultDirX: 0, defaultDirY: -1, defaultDirZ: 0 },
};

interface Props {
  config: MappingConfig;
  onChange: (config: MappingConfig) => void;
  onReset: () => void;
}

export default function BoneMappingControls({ config, onChange, onReset }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const updateBone = (boneName: keyof MappingConfig, field: keyof BoneConfig, value: boolean | number) => {
    onChange({
      ...config,
      [boneName]: {
        ...config[boneName],
        [field]: value
      }
    });
  };

  const bones: { key: keyof MappingConfig; label: string }[] = [
    { key: 'leftArm', label: '왼쪽 상완 (어깨→팔꿈치)' },
    { key: 'leftForeArm', label: '왼쪽 전완 (팔꿈치→손목)' },
    { key: 'rightArm', label: '오른쪽 상완 (어깨→팔꿈치)' },
    { key: 'rightForeArm', label: '오른쪽 전완 (팔꿈치→손목)' },
    { key: 'leftUpLeg', label: '왼쪽 대퇴 (골반→무릎)' },
    { key: 'leftLeg', label: '왼쪽 종아리 (무릎→발목)' },
    { key: 'rightUpLeg', label: '오른쪽 대퇴 (골반→무릎)' },
    { key: 'rightLeg', label: '오른쪽 종아리 (무릎→발목)' },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <button
          onClick={onReset}
          type="button"
          className="px-3 py-1 text-sm bg-blue-500 text-white hover:bg-blue-600 rounded"
        >
          초기화
        </button>
        <span className="text-xs text-gray-500">현재: {expanded || '없음'}</span>
      </div>

      <div className="space-y-2">
        {bones.map(({ key, label }) => {
          const bone = config[key];
          const isExpanded = expanded === key;

          return (
            <div key={key} className="border border-gray-300 rounded">
              <button
                onClick={() => {
                  console.log('Bone clicked:', key);
                  setExpanded(isExpanded ? null : key);
                }}
                type="button"
                className="w-full px-3 py-2 text-left bg-gray-50 hover:bg-gray-100 flex justify-between items-center transition"
              >
                <span className="font-medium text-sm">{label}</span>
                <span className="text-xs text-gray-500">{isExpanded ? '▼' : '▶'}</span>
              </button>

              {isExpanded && (
                <div className="p-3 space-y-3 bg-white border-t">
                  {/* Axis Flips */}
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-1">좌표 반전:</p>
                    <div className="flex gap-3">
                      <label className="flex items-center text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={bone.flipX}
                          onChange={(e) => updateBone(key, 'flipX', e.target.checked)}
                          className="mr-1"
                        />
                        X 반전
                      </label>
                      <label className="flex items-center text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={bone.flipY}
                          onChange={(e) => updateBone(key, 'flipY', e.target.checked)}
                          className="mr-1"
                        />
                        Y 반전
                      </label>
                      <label className="flex items-center text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={bone.flipZ}
                          onChange={(e) => updateBone(key, 'flipZ', e.target.checked)}
                          className="mr-1"
                        />
                        Z 반전
                      </label>
                    </div>
                  </div>

                  {/* Default Direction */}
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-1">기본 방향 (T-pose):</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-xs text-gray-600">X:</label>
                        <input
                          type="number"
                          value={bone.defaultDirX}
                          onChange={(e) => updateBone(key, 'defaultDirX', parseFloat(e.target.value))}
                          step="0.1"
                          className="w-full px-2 py-1 text-xs border rounded"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">Y:</label>
                        <input
                          type="number"
                          value={bone.defaultDirY}
                          onChange={(e) => updateBone(key, 'defaultDirY', parseFloat(e.target.value))}
                          step="0.1"
                          className="w-full px-2 py-1 text-xs border rounded"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">Z:</label>
                        <input
                          type="number"
                          value={bone.defaultDirZ}
                          onChange={(e) => updateBone(key, 'defaultDirZ', parseFloat(e.target.value))}
                          step="0.1"
                          className="w-full px-2 py-1 text-xs border rounded"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 pt-3 border-t text-xs text-gray-500">
        <p>💡 팁: 차렷 자세를 취하고 모델이 따라하는지 확인하세요</p>
      </div>
    </div>
  );
}
