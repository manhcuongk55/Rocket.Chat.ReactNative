import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { useTheme, type TColors } from '../../../theme';
import { type IProperty } from '../../../lib/services/realEstate/types';

interface IPropertyCardProps {
    property: IProperty;
}

const PropertyCard = memo(({ property }: IPropertyCardProps) => {
    const { colors } = useTheme();
    const styles = getCardStyles(colors);

    const formatPrice = (price: number, currency: string) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: currency || 'USD',
            maximumFractionDigits: 0
        }).format(price);
    };

    return (
        <View style={styles.card}>
            <View style={styles.priceRow}>
                <Text style={styles.price}>{formatPrice(property.price, property.currency)}</Text>
                {property.rooms && (
                    <Text style={styles.badge}>{property.rooms} phòng</Text>
                )}
            </View>
            <Text style={styles.title} numberOfLines={2}>{property.title}</Text>
            <Text style={styles.location}>📍 {property.location}</Text>
            {property.area && (
                <Text style={styles.detail}>📐 {property.area} m²</Text>
            )}
            {property.description && (
                <Text style={styles.description} numberOfLines={3}>{property.description}</Text>
            )}
            {property.amenities && property.amenities.length > 0 && (
                <View style={styles.amenitiesRow}>
                    {property.amenities.slice(0, 4).map((a, i) => (
                        <Text key={i} style={styles.amenityTag}>{a}</Text>
                    ))}
                </View>
            )}
        </View>
    );
});

PropertyCard.displayName = 'PropertyCard';
export default PropertyCard;

const getCardStyles = (colors: TColors) =>
    StyleSheet.create({
        card: {
            backgroundColor: colors.surfaceLight,
            borderRadius: 12,
            padding: 14,
            marginVertical: 6,
            borderWidth: 1,
            borderColor: colors.strokeExtraLight,
            gap: 6
        },
        priceRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center'
        },
        price: {
            color: colors.buttonBackgroundPrimaryDefault,
            fontSize: 18,
            fontWeight: '700'
        },
        badge: {
            backgroundColor: colors.statusBackgroundInfo,
            color: colors.statusFontInfo,
            fontSize: 12,
            fontWeight: '600',
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 8
        },
        title: {
            color: colors.fontTitlesLabels,
            fontSize: 15,
            fontWeight: '600'
        },
        location: {
            color: colors.fontHint,
            fontSize: 13
        },
        detail: {
            color: colors.fontHint,
            fontSize: 13
        },
        description: {
            color: colors.fontDefault,
            fontSize: 13,
            lineHeight: 18
        },
        amenitiesRow: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 6,
            marginTop: 4
        },
        amenityTag: {
            backgroundColor: colors.surfaceNeutral,
            color: colors.fontSecondaryInfo,
            fontSize: 11,
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 6
        }
    });
